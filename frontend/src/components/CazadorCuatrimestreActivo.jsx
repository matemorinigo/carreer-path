import { useState } from 'react'
import MateriaCard from './MateriaCard'
import cazadorImg from '../assets/alfaro.jpeg'

const CUATRI_LABELS = { 1: '1er cuatrimestre', 2: '2do cuatrimestre' }
const DAY_ORDER = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA']

function earliestDay(materia) {
  if (!materia.horarios?.length) return DAY_ORDER.length
  return Math.min(
    ...materia.horarios.map((h) => {
      const idx = DAY_ORDER.indexOf(h.dia)
      return idx >= 0 ? idx : DAY_ORDER.length
    })
  )
}

function esContinuacionAnual(materia) {
  return materia.anual && materia.sinOferta
}

export default function CazadorCuatrimestreActivo({ cuatrimestre, baseYear, cuatrimestreInicio = 1, ofertaFieldVisibility, onAvanzar, loading }) {
  const { numero, materias } = cuatrimestre

  const materiasSeleccionables = materias.filter(m => !esContinuacionAnual(m))
  const continuacionesAnuales = materias.filter(m => esContinuacionAnual(m))

  const [aprobadas, setAprobadas] = useState(new Set(materiasSeleccionables.map(m => m.materiaId)))

  const cuatrimestreReal = cuatrimestreInicio + numero - 1
  const actualYear = baseYear + Math.floor((cuatrimestreReal - 1) / 2)
  const half = cuatrimestreReal % 2 === 1 ? 1 : 2
  const label = CUATRI_LABELS[half] || `Cuatrimestre ${half}`
  const sorted = [...materiasSeleccionables].sort((a, b) => earliestDay(a) - earliestDay(b))

  function toggleMateria(materiaId) {
    setAprobadas(prev => {
      const next = new Set(prev)
      if (next.has(materiaId)) next.delete(materiaId)
      else next.add(materiaId)
      return next
    })
  }

  function handleAvanzar() {
    const resultadoSeleccionables = materiasSeleccionables.map(m => ({
      ...m,
      aprobada: aprobadas.has(m.materiaId),
    }))
    const resultadoAnuales = continuacionesAnuales.map(m => ({
      ...m,
      aprobada: true,
    }))
    onAvanzar([...resultadoSeleccionables, ...resultadoAnuales])
  }

  const aprobadasCount = aprobadas.size
  const totalCount = materiasSeleccionables.length

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden bg-gradient-to-r from-fuchsia-500/10 to-violet-500/10 border border-fuchsia-500/30 rounded-xl p-5">
        <img src={cazadorImg} alt="" className="absolute right-0 top-0 h-full w-32 object-cover object-top opacity-10 mask-l" style={{ maskImage: 'linear-gradient(to right, transparent, black)' }} />
        <div className="relative flex items-center justify-between mb-1">
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-bold text-white">{actualYear}</span>
            <span className="text-sm text-neutral-500">— {label}</span>
          </div>
          <span className="text-xs text-fuchsia-400 bg-fuchsia-500/15 px-3 py-1 rounded-full font-medium">
            Cuatrimestre actual
          </span>
        </div>
        <p className="relative text-xs text-neutral-500">
          Marcá las materias que aprobaste y avanzá al siguiente cuatrimestre
        </p>
      </div>

      {continuacionesAnuales.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <p className="text-xs text-amber-400 font-medium mb-2">Continuación anual (se aprueban automáticamente)</p>
          {continuacionesAnuales.map(m => (
            <p key={m.materiaId} className="text-sm text-amber-300/70">{m.nombre}</p>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((materia) => (
          <MateriaCard
            key={materia.materiaId}
            materia={materia}
            ofertaFieldVisibility={ofertaFieldVisibility}
            selectable
            selected={aprobadas.has(materia.materiaId)}
            onToggle={() => toggleMateria(materia.materiaId)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-neutral-500">
          {aprobadasCount} de {totalCount} marcadas como aprobadas
        </p>
        <button
          onClick={handleAvanzar}
          disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium cursor-pointer"
        >
          {loading ? 'Recalculando...' : 'Avanzar cuatrimestre →'}
        </button>
      </div>
    </div>
  )
}
