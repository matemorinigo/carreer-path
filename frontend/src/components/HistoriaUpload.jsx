import { useState, useRef } from 'react'
import { parseHistoriaHtml, isHtml } from '../utils/parseHistoriaHtml'

const SAMPLE_HINT = `Pegá acá el HTML de tu historia académica (desde el SIU) o el JSON exportado...`

export default function HistoriaUpload({ onGenerar }) {
  const [rawText, setRawText] = useState('')
  const [maxMaterias, setMaxMaterias] = useState(5)
  const [parseError, setParseError] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [format, setFormat] = useState(null)
  const [fileName, setFileName] = useState(null)
  const fileInputRef = useRef(null)
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

  function handleFileRead(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      setRawText(text)
      setFileName(file.name)
      validateAndParse(text)
    }
    reader.readAsText(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    dropRef.current?.classList.remove('border-indigo-400')
    const file = e.dataTransfer.files[0]
    if (file) handleFileRead(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
    dropRef.current?.classList.add('border-indigo-400')
  }

  function handleDragLeave() {
    dropRef.current?.classList.remove('border-indigo-400')
  }

  function handleSubmit() {
    const data = parsedData || validateAndParse(rawText)
    if (data) onGenerar(data, maxMaterias)
  }

  const isValid = parsedData !== null && !parseError

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Planificá tu carrera</h2>
        <p className="text-slate-400">
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
        className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-slate-500 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.html,.htm"
          className="hidden"
          onChange={(e) => e.target.files[0] && handleFileRead(e.target.files[0])}
        />
        <div className="space-y-2">
          <div className="text-4xl">📄</div>
          {fileName ? (
            <p className="text-indigo-400 font-medium">{fileName}</p>
          ) : (
            <>
              <p className="text-slate-300 font-medium">
                Arrastrá tu archivo <code className="text-indigo-400">.json</code> o <code className="text-indigo-400">.html</code> acá
              </p>
              <p className="text-sm text-slate-500">o hacé click para seleccionar</p>
            </>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-sm text-slate-500">o pegá el contenido</span>
        <div className="flex-1 h-px bg-slate-700" />
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
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-y"
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
            {format === 'html' ? 'HTML parseado' : 'JSON válido'} — {parsedData.length} materias detectadas
          </p>
        )}
      </div>

      {/* Max materias slider */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-300">
            Materias por cuatrimestre
          </label>
          <span className="text-2xl font-bold text-indigo-400">{maxMaterias}</span>
        </div>
        <input
          type="range"
          min={2}
          max={7}
          value={maxMaterias}
          onChange={(e) => setMaxMaterias(Number(e.target.value))}
          className="w-full accent-indigo-500"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>2 (tranqui)</span>
          <span>7 (a full)</span>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!isValid}
        className="w-full py-4 rounded-xl font-semibold text-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
      >
        Generar plan óptimo
      </button>
    </div>
  )
}
