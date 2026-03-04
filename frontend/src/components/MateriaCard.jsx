const DAY_ORDER = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA']
const DAY_MAP = {
  LU: 'Lunes',
  MA: 'Martes',
  MI: 'Miércoles',
  JU: 'Jueves',
  VI: 'Viernes',
  SA: 'Sábado',
}

export default function MateriaCard({ materia }) {
  const {
    nombre,
    comisionId,
    sede,
    modalidad,
    horarios,
    sinOferta,
    anual,
    estimado,
    conflictoCon,
  } = materia

  const esDistancia = modalidad && modalidad.toLowerCase().includes('distancia')

  const borderColor = esDistancia
    ? 'border-sky-500/40'
    : anual
    ? 'border-amber-500/40'
    : estimado
    ? 'border-violet-500/40'
    : sinOferta
    ? 'border-neutral-700/50'
    : 'border-emerald-500/40'

  const bgColor = esDistancia
    ? 'bg-sky-500/5'
    : anual
    ? 'bg-amber-500/5'
    : estimado
    ? 'bg-violet-500/5'
    : sinOferta
    ? 'bg-neutral-900/30'
    : 'bg-emerald-500/5'

  return (
    <div className={`${bgColor} ${borderColor} border rounded-xl p-4 space-y-3 transition-all hover:scale-[1.02]`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-tight text-neutral-200">
          {nombre}
        </h3>
        <div className="flex gap-1.5 shrink-0">
          {esDistancia && <Badge text="A distancia" color="sky" />}
          {estimado && <Badge text="Estimado" color="violet" />}
          {anual && <Badge text="Anual" color="amber" />}
          {sinOferta && !anual && !estimado && <Badge text="Sin oferta" color="neutral" />}
        </div>
      </div>

      {/* Comision + Sede + Modalidad */}
      {!sinOferta && (
        <div className="space-y-1.5 text-xs text-neutral-500">
          <div className="flex items-center gap-2 flex-wrap">
            {comisionId && (
              <span className={`px-2 py-0.5 rounded ${estimado ? 'bg-violet-500/10 text-violet-400/60' : 'bg-neutral-800/50 text-neutral-400'}`}>
                Com. {comisionId}
              </span>
            )}
            {modalidad && (
              <ModalidadBadge modalidad={modalidad} />
            )}
          </div>
          {sede && <p className="text-neutral-600">{sede}</p>}
        </div>
      )}

      {/* Horarios */}
      {horarios && horarios.length > 0 && (
        <div className="space-y-1">
          {[...horarios].sort((a, b) => DAY_ORDER.indexOf(a.dia) - DAY_ORDER.indexOf(b.dia)).map((h, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 text-xs ${estimado ? 'opacity-60' : ''}`}
            >
              <span className={`font-medium w-20 ${estimado ? 'text-violet-400/70' : 'text-neutral-400'}`}>
                {DAY_MAP[h.dia] || h.dia}
              </span>
              <span className="text-neutral-600">
                {h.horaInicio} — {h.horaFin}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Conflicto info */}
      {conflictoCon && (
        <p className="text-[11px] text-amber-400/70 leading-tight">
          ⚠ Movida por choque con {conflictoCon}
        </p>
      )}
    </div>
  )
}

function Badge({ text, color }) {
  const colors = {
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    neutral: 'bg-neutral-800/50 text-neutral-500 border-neutral-700/50',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    sky: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colors[color]}`}>
      {text}
    </span>
  )
}

function ModalidadBadge({ modalidad }) {
  const lower = modalidad.toLowerCase()
  let color = 'text-neutral-500 bg-neutral-800/50'
  if (lower.includes('presencial') && !lower.includes('semi')) {
    color = 'text-emerald-400 bg-emerald-500/15'
  } else if (lower.includes('semi')) {
    color = 'text-teal-400 bg-teal-500/15'
  } else if (lower.includes('distancia')) {
    color = 'text-sky-400 bg-sky-500/15'
  } else if (lower.includes('teams') || lower.includes('sincr')) {
    color = 'text-green-400 bg-green-500/15'
  }

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${color}`}>
      {modalidad}
    </span>
  )
}
