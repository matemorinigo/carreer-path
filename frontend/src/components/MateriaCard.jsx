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
  } = materia

  const borderColor = anual
    ? 'border-amber-500/40'
    : sinOferta
    ? 'border-slate-600/50'
    : 'border-indigo-500/40'

  const bgColor = anual
    ? 'bg-amber-500/5'
    : sinOferta
    ? 'bg-slate-800/30'
    : 'bg-indigo-500/5'

  return (
    <div className={`${bgColor} ${borderColor} border rounded-xl p-4 space-y-3 transition-all hover:scale-[1.02]`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-tight text-slate-200">
          {nombre}
        </h3>
        <div className="flex gap-1.5 shrink-0">
          {anual && <Badge text="Anual" color="amber" />}
          {sinOferta && !anual && <Badge text="Sin oferta" color="slate" />}
        </div>
      </div>

      {/* Comision + Sede + Modalidad */}
      {!sinOferta && (
        <div className="space-y-1.5 text-xs text-slate-400">
          <div className="flex items-center gap-2 flex-wrap">
            {comisionId && (
              <span className="bg-slate-700/50 px-2 py-0.5 rounded text-slate-300">
                Com. {comisionId}
              </span>
            )}
            {modalidad && (
              <ModalidadBadge modalidad={modalidad} />
            )}
          </div>
          {sede && <p className="text-slate-500">{sede}</p>}
        </div>
      )}

      {/* Horarios */}
      {horarios && horarios.length > 0 && (
        <div className="space-y-1">
          {horarios.map((h, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs"
            >
              <span className="font-medium text-slate-300 w-20">
                {DAY_MAP[h.dia] || h.dia}
              </span>
              <span className="text-slate-500">
                {h.horaInicio} — {h.horaFin}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Badge({ text, color }) {
  const colors = {
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    slate: 'bg-slate-700/50 text-slate-400 border-slate-600/50',
    indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  }
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colors[color]}`}>
      {text}
    </span>
  )
}

function ModalidadBadge({ modalidad }) {
  const lower = modalidad.toLowerCase()
  let color = 'text-slate-400 bg-slate-700/50'
  if (lower.includes('presencial') && !lower.includes('semi')) {
    color = 'text-emerald-400 bg-emerald-500/15'
  } else if (lower.includes('semi')) {
    color = 'text-sky-400 bg-sky-500/15'
  } else if (lower.includes('teams') || lower.includes('sincr')) {
    color = 'text-violet-400 bg-violet-500/15'
  }

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${color}`}>
      {modalidad}
    </span>
  )
}
