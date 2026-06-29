import { useState } from 'react'

const CUATRI_LABELS = { 1: '1er cuatrimestre', 2: '2do cuatrimestre' }

export default function CazadorHistorial({ cuatrisResueltos, baseYear }) {
  const [expandido, setExpandido] = useState(null)

  if (!cuatrisResueltos.length) return null

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-3">
        Cuatrimestres anteriores
      </h3>
      {cuatrisResueltos.map((cuatri, idx) => {
        const actualYear = baseYear + Math.floor((cuatri.numero - 1) / 2)
        const half = cuatri.numero % 2 === 1 ? 1 : 2
        const label = CUATRI_LABELS[half]
        const aprobadas = cuatri.materias.filter(m => m.aprobada).length
        const total = cuatri.materias.length
        const isOpen = expandido === idx

        return (
          <div key={idx} className="border border-neutral-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandido(isOpen ? null : idx)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-900/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-neutral-300">
                  {actualYear} — {label}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${aprobadas === total ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                  {aprobadas}/{total} aprobadas
                </span>
              </div>
              <span className="text-neutral-600 text-xs">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="px-4 pb-3 space-y-1.5 border-t border-neutral-800/50">
                {cuatri.materias.map((m) => (
                  <div key={m.materiaId} className="flex items-center gap-2 py-1">
                    <span className={`w-2 h-2 rounded-full ${m.aprobada ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className={`text-sm ${m.aprobada ? 'text-neutral-300' : 'text-neutral-500 line-through'}`}>
                      {m.nombre}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
