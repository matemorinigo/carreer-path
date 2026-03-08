import { useState, useRef } from 'react'
import { parseHistoriaHtml, isHtml } from '../utils/parseHistoriaHtml'
import { parseHistoriaPdf, isPdf } from '../utils/parseHistoriaPdf'
import { parseOfertaHtml } from '../utils/parseOfertaHtml'

const SAMPLE_HINT = `Pegá acá el HTML de tu historia académica (desde el SIU) o el JSON exportado...`

export default function HistoriaUpload({ onGenerar }) {
  const [rawText, setRawText] = useState('')
  const [maxMaterias, setMaxMaterias] = useState(5)
  const [modoOptimo, setModoOptimo] = useState(false)
  const [turnos, setTurnos] = useState({ manana: true, tarde: true, noche: true })
  const [parseError, setParseError] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [format, setFormat] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [ofertaData, setOfertaData] = useState(null)
  const [ofertaFileName, setOfertaFileName] = useState(null)
  const [ofertaError, setOfertaError] = useState(null)
  const fileInputRef = useRef(null)
  const ofertaInputRef = useRef(null)
  const dropRef = useRef(null)

  function validateAndParse(text) {
    if (!text.trim()) {
      setParseError(null)
      setParsedData(null)
      setFormat(null)
      return null
    }

    if (isHtml(text)) {
      try {
        const data = parseHistoriaHtml(text)
        if (data.length === 0) {
          setParseError('No se encontraron materias en el HTML. Asegurate de copiar la página completa.')
          setParsedData(null)
          setFormat(null)
          return null
        }
        setParseError(null)
        setParsedData(data)
        setFormat('html')
        return data
      } catch (err) {
        setParseError('Error parseando HTML: ' + err.message)
        setParsedData(null)
        setFormat(null)
        return null
      }
    }

    try {
      const data = JSON.parse(text)
      if (!Array.isArray(data)) throw new Error('El JSON debe ser un array')
      if (data.length === 0) throw new Error('El array está vacío')
      if (!data[0].codigo && !data[0].nombre) {
        throw new Error('Los objetos deben tener al menos "codigo" y "nombre"')
      }
      setParseError(null)
      setParsedData(data)
      setFormat('json')
      return data
    } catch (err) {
      setParseError(err.message)
      setParsedData(null)
      setFormat(null)
      return null
    }
  }

  async function handlePdfFile(file) {
    setFileName(file.name)
    setRawText('')
    try {
      let arrayBuffer
      try {
        if (typeof file.arrayBuffer === 'function') {
          arrayBuffer = await file.arrayBuffer()
        } else {
          arrayBuffer = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = () => reject(reader.error)
            reader.readAsArrayBuffer(file)
          })
        }
      } catch (err) {
        setParseError(`Error leyendo archivo (paso 1 - arrayBuffer): ${err.message} | ${err.stack?.slice(0, 200)}`)
        setParsedData(null)
        setFormat(null)
        return
      }

      let data
      try {
        data = await parseHistoriaPdf(arrayBuffer)
      } catch (err) {
        setParseError(`Error parseando PDF (paso 2 - pdfjs): ${err.message} | ${err.stack?.slice(0, 300)}`)
        setParsedData(null)
        setFormat(null)
        return
      }

      if (data.length === 0) {
        setParseError('No se encontraron materias en el PDF. Asegurate de subir la historia académica del SIU.')
        setParsedData(null)
        setFormat(null)
        return
      }
      setParseError(null)
      setParsedData(data)
      setFormat('pdf')
    } catch (err) {
      setParseError(`Error inesperado: ${err.message} | ${err.stack?.slice(0, 300)}`)
      setParsedData(null)
      setFormat(null)
    }
  }

  function handleFileRead(file) {
    if (isPdf(file)) {
      handlePdfFile(file)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      setRawText(text)
      setFileName(file.name)
      validateAndParse(text)
    }
    reader.readAsText(file)
  }

  function handleOfertaFile(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = parseOfertaHtml(e.target.result)
        if (result.totalMaterias === 0) {
          setOfertaError('No se encontraron materias en el HTML. Revisá que sea la página de Oferta de Materias.')
          setOfertaData(null)
          setOfertaFileName(null)
          return
        }
        setOfertaData(result.materias)
        setOfertaFileName(`${file.name} — ${result.totalMaterias} materias, ${result.totalComisiones} comisiones`)
        setOfertaError(null)
      } catch (err) {
        setOfertaError('Error parseando HTML de oferta: ' + err.message)
        setOfertaData(null)
        setOfertaFileName(null)
      }
    }
    reader.readAsText(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    dropRef.current?.classList.remove('border-emerald-400')
    const file = e.dataTransfer.files[0]
    if (file) handleFileRead(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
    dropRef.current?.classList.add('border-emerald-400')
  }

  function handleDragLeave() {
    dropRef.current?.classList.remove('border-emerald-400')
  }

  function handleSubmit() {
    const data = parsedData || validateAndParse(rawText)
    if (!data) return
    const turnosActivos = Object.entries(turnos).filter(([, v]) => v).map(([k]) => k)
    onGenerar(data, modoOptimo ? 0 : maxMaterias, turnosActivos, ofertaData)
  }

  function toggleTurno(turno) {
    setTurnos(prev => ({ ...prev, [turno]: !prev[turno] }))
  }

  const isValid = parsedData !== null && !parseError

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Planificá tu carrera</h2>
        <p className="text-neutral-500">
          Subí tu historia académica y te armamos el recorrido óptimo
        </p>
      </div>

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-600/50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.html,.htm,.pdf"
          className="hidden"
          onChange={(e) => e.target.files[0] && handleFileRead(e.target.files[0])}
        />
        <div className="space-y-2">
          <div className="text-4xl">📄</div>
          {fileName ? (
            <p className="text-emerald-400 font-medium">{fileName}</p>
          ) : (
            <>
              <p className="text-neutral-300 font-medium">
                Arrastrá tu archivo <code className="text-emerald-400">.pdf</code>, <code className="text-emerald-400">.json</code> o <code className="text-emerald-400">.html</code> acá
              </p>
              <p className="text-sm text-neutral-600">o hacé click para seleccionar</p>
            </>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-neutral-800" />
        <span className="text-sm text-neutral-600">o pegá el contenido</span>
        <div className="flex-1 h-px bg-neutral-800" />
      </div>

      {/* Textarea */}
      <div className="space-y-2">
        <textarea
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value)
            setFileName(null)
            validateAndParse(e.target.value)
          }}
          placeholder={SAMPLE_HINT}
          rows={10}
          className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 text-sm font-mono text-neutral-300 placeholder-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-y"
        />
        {parseError && (
          <p className="text-red-400 text-sm flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full" />
            {parseError}
          </p>
        )}
        {parsedData && !parseError && (
          <p className="text-emerald-400 text-sm flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            {format === 'pdf' ? 'PDF parseado' : format === 'html' ? 'HTML parseado' : 'JSON válido'} — {parsedData.length} materias detectadas
          </p>
        )}
      </div>

      {/* Turnos */}
      <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-6 space-y-4">
        <label className="text-sm font-medium text-neutral-300">Turnos disponibles</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'manana', label: 'Mañana', desc: '8 a 13 hs' },
            { key: 'tarde', label: 'Tarde', desc: '13 a 18 hs' },
            { key: 'noche', label: 'Noche', desc: '18 a 23 hs' },
          ].map(({ key, label, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleTurno(key)}
              className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${
                turnos[key]
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-neutral-900/50 border-neutral-800 text-neutral-600'
              }`}
            >
              <p className="font-medium text-sm">{label}</p>
              <p className="text-[11px] mt-0.5 opacity-70">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Max materias slider + modo optimo */}
      <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-neutral-300">
            Materias por cuatrimestre
          </label>
          {!modoOptimo && (
            <span className="text-2xl font-bold text-emerald-400">{maxMaterias}</span>
          )}
          {modoOptimo && (
            <span className="text-sm font-medium text-emerald-400">sin límite</span>
          )}
        </div>
        <input
          type="range"
          min={2}
          max={7}
          value={maxMaterias}
          onChange={(e) => setMaxMaterias(Number(e.target.value))}
          disabled={modoOptimo}
          className="w-full accent-emerald-500 disabled:opacity-30"
        />
        <div className="flex items-center justify-between">
          <div className="flex justify-between text-xs text-neutral-600 flex-1">
            <span>2 (tranqui)</span>
            <span>7 (a full)</span>
          </div>
        </div>
        <label className="flex items-center gap-3 pt-2 border-t border-neutral-800/50 cursor-pointer">
          <input
            type="checkbox"
            checked={modoOptimo}
            onChange={(e) => setModoOptimo(e.target.checked)}
            className="w-4 h-4 accent-emerald-500 rounded"
          />
          <div>
            <span className="text-sm text-neutral-300">Seleccionar lo óptimo</span>
            <p className="text-[11px] text-neutral-600">Mete todas las que pueda sin choque de horario</p>
          </div>
        </label>
      </div>

      {/* Oferta custom */}
      <details className="group">
        <summary className="flex items-center gap-2 cursor-pointer text-sm text-neutral-500 hover:text-neutral-300 transition-colors select-none">
          <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Actualizar oferta de materias (opcional)
        </summary>
        <div className="mt-3 bg-neutral-900/30 border border-neutral-800/50 rounded-xl p-5 space-y-3">
          <p className="text-xs text-neutral-500 leading-relaxed">
            Andá a <span className="text-neutral-300">Intraconsulta</span> {'>'} <span className="text-neutral-300">Inscripciones</span> {'>'} <span className="text-neutral-300">Oferta de Materias</span>. Click derecho {'>'} Guardar como. Subí el <code className="text-emerald-400">.html</code> acá.
          </p>
          <button
            type="button"
            onClick={() => ofertaInputRef.current?.click()}
            className="w-full py-2.5 rounded-lg border border-dashed border-neutral-700 text-sm text-neutral-400 hover:border-emerald-600/50 hover:text-neutral-300 transition-colors cursor-pointer"
          >
            {ofertaFileName ? ofertaFileName : 'Seleccionar archivo .html de oferta'}
          </button>
          <input
            ref={ofertaInputRef}
            type="file"
            accept=".html,.htm"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleOfertaFile(e.target.files[0])}
          />
          {ofertaError && (
            <p className="text-red-400 text-xs flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 bg-red-400 rounded-full" />
              {ofertaError}
            </p>
          )}
          {ofertaData && !ofertaError && (
            <div className="flex items-center justify-between">
              <p className="text-emerald-400 text-xs flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Oferta cargada correctamente
              </p>
              <button
                type="button"
                onClick={() => { setOfertaData(null); setOfertaFileName(null); setOfertaError(null) }}
                className="text-xs text-neutral-600 hover:text-red-400 transition-colors cursor-pointer"
              >
                Quitar
              </button>
            </div>
          )}
        </div>
      </details>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!isValid || !Object.values(turnos).some(Boolean)}
        className="w-full py-4 rounded-xl font-semibold text-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
      >
        Generar plan óptimo
      </button>
    </div>
  )
}
