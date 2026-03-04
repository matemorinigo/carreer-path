import MateriaCard from './MateriaCard'

const CUATRI_LABELS = {
  1: '1er cuatrimestre',
  2: '2do cuatrimestre',
}

export default function CuatrimestreCard({ cuatrimestre, baseYear }) {
  const { numero, materias } = cuatrimestre
  const startYear = baseYear || new Date().getFullYear()
  const actualYear = startYear + Math.floor((numero - 1) / 2)
  const half = numero % 2 === 1 ? 1 : 2
  const label = CUATRI_LABELS[half] || `Cuatrimestre ${half}`

  return (
    <div className="relative">
      {/* Timeline connector */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-800/50" />

      <div className="relative pl-14">
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

        {/* Cards grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {materias.map((materia) => (
            <MateriaCard key={materia.materiaId} materia={materia} />
          ))}
        </div>
      </div>
    </div>
  )
}
