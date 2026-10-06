import MateriaCard from './MateriaCard'

const CUATRI_LABELS = {
  1: '1er cuatrimestre',
  2: '2do cuatrimestre',
}

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

// Estilos del cuatrimestre mientras se arrastra una materia (ver PlanTimelineEditable).
const DROP_STYLES = {
  ok: 'outline-2 outline-dashed outline-emerald-500/40 bg-emerald-500/5',
  okOver: 'outline-2 outline-emerald-400 bg-emerald-500/10',
  bloqueado: 'opacity-40',
  bloqueadoOver: 'outline-2 outline-red-500/60 bg-red-500/5',
}

export default function CuatrimestreCard({
  cuatrimestre,
  baseYear,
  cuatrimestreInicio = 1,
  ofertaFieldVisibility,
  onIntercambiar,
  renderMateria,
  dropRef,
  dropStatus,
  dropMotivo,
}) {
  const { numero, materias } = cuatrimestre
  const startYear = baseYear || new Date().getFullYear()
  const cuatrimestreReal = cuatrimestreInicio + numero - 1
  const actualYear = startYear + Math.floor((cuatrimestreReal - 1) / 2)
  const half = cuatrimestreReal % 2 === 1 ? 1 : 2
  const label = CUATRI_LABELS[half] || `Cuatrimestre ${half}`

  const sorted = [...materias].sort((a, b) => earliestDay(a) - earliestDay(b))

  return (
    <div className="relative">
      {/* Timeline connector */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-800/50" />

      <div ref={dropRef} className={`relative pl-14 rounded-xl outline-offset-4 transition-all ${dropStatus ? DROP_STYLES[dropStatus] : ''}`}>
        {/* Timeline dot */}
        <div className="absolute left-4 top-5 w-5 h-5 rounded-full bg-emerald-500 border-4 border-neutral-950 z-10" />

        {/* Header */}
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-lg font-bold text-white">{actualYear}</span>
          <span className="text-sm text-neutral-500">— {label}</span>
          <span className="ml-auto text-xs text-neutral-600 bg-neutral-900 px-2.5 py-1 rounded-full">
            {materias.length} {materias.length === 1 ? 'materia' : 'materias'}
          </span>
        </div>

        {dropMotivo && (
          <p className="text-xs text-red-400 -mt-2 mb-3">✕ {dropMotivo}</p>
        )}

        {/* Cards grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((materia) => renderMateria ? renderMateria(materia) : (
            <MateriaCard
              key={materia.materiaId}
              materia={materia}
              ofertaFieldVisibility={ofertaFieldVisibility}
              onIntercambiar={onIntercambiar}
              cuatrimestreInicio={cuatrimestreInicio}
              baseYear={baseYear}
            />
          ))}
          {materias.length === 0 && (
            <p className="text-sm text-neutral-600 italic py-4">Cuatrimestre libre</p>
          )}
        </div>
      </div>
    </div>
  )
}
