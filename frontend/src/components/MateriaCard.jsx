import { cuatriLabelCorto } from '../utils/cuatrimestre'

const DAY_ORDER = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA']
const DAY_MAP = {
  LU: 'Lunes',
  MA: 'Martes',
  MI: 'Miércoles',
  JU: 'Jueves',
  VI: 'Viernes',
  SA: 'Sábado',
}

function hasDisplayValue(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

export default function MateriaCard({ materia, ofertaFieldVisibility, selectable, selected, onToggle, onIntercambiar, cuatrimestreInicio = 1, baseYear }) {
  const {
    materiaId,
    nombre,
    comisionId,
    sede,
    modalidad,
    horarios,
    sinOferta,
    electiva,
    anual,
    estimado,
    conflictoCon,
    ofertaFueraDeTurno,
    intercambiables,
  } = materia

  const visibility = ofertaFieldVisibility || {
    comisionId: true,
    modalidad: true,
    sede: true,
  }

  const ofertaItems = [
    hasDisplayValue(materiaId)
      ? { label: 'Código', value: materiaId }
      : null,
    visibility.comisionId && hasDisplayValue(comisionId)
      ? { label: 'Comisión', value: comisionId }
      : null,
    visibility.modalidad && hasDisplayValue(modalidad)
      ? { label: 'Modalidad', value: modalidad }
      : null,
    visibility.sede && hasDisplayValue(sede)
      ? { label: 'Sede', value: sede }
      : null,
  ].filter(Boolean)

  const esDistancia = modalidad && modalidad.toLowerCase().includes('distancia')

  const selectableBorder = selectable
    ? selected ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-red-500/40'
    : null

  const selectableBg = selectable
    ? selected ? 'bg-emerald-500/10' : 'bg-red-500/5'
    : null

  const borderColor = selectableBorder || (esDistancia
    ? 'border-sky-500/40'
    : anual
    ? 'border-amber-500/40'
    : estimado
    ? 'border-violet-500/40'
    : sinOferta
    ? 'border-neutral-700/50'
    : 'border-emerald-500/40')

  const bgColor = selectableBg || (esDistancia
    ? 'bg-sky-500/5'
    : anual
    ? 'bg-amber-500/5'
    : estimado
    ? 'bg-violet-500/5'
    : sinOferta
    ? 'bg-neutral-900/30'
    : 'bg-emerald-500/5')

  return (
    <div
      className={`${bgColor} ${borderColor} border rounded-xl p-4 space-y-3 transition-all ${selectable ? 'cursor-pointer hover:scale-[1.03]' : 'hover:scale-[1.02]'}`}
      onClick={selectable ? onToggle : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        {selectable && (
          <div className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 transition-colors ${selected ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-600 bg-transparent'}`}>
            {selected && <span className="text-white text-xs font-bold">✓</span>}
          </div>
        )}
        <h3 className="font-semibold text-sm leading-tight text-neutral-200 flex-1">
          {nombre}
        </h3>
        <div className="flex gap-1.5 shrink-0">
          {electiva && <Badge text="Electiva" color="fuchsia" />}
          {esDistancia && <Badge text="A distancia" color="sky" />}
          {estimado && <Badge text="Estimado" color="violet" />}
          {anual && <Badge text="Anual" color="amber" />}
          {sinOferta && !anual && !estimado && <Badge text="Sin oferta" color="neutral" />}
        </div>
      </div>

      {!sinOferta && ofertaItems.length > 0 && (
        <div className="space-y-1.5 text-xs text-neutral-500">
          {ofertaItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-neutral-500 min-w-20">{item.label}:</span>
              {item.label === 'Modalidad' ? (
                <ModalidadBadge modalidad={item.value} />
              ) : (
                <span className={`px-2 py-0.5 rounded ${estimado ? 'bg-violet-500/10 text-violet-400/60' : 'bg-neutral-800/50 text-neutral-300'}`}>
                  {item.value}
                </span>
              )}
            </div>
          ))}
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

      {/* Oferta fuera del turno seleccionado */}
      {ofertaFueraDeTurno && (
        <p className="text-[11px] text-sky-400/70 leading-tight">
          ℹ Existe oferta fuera de tu turno: {ofertaFueraDeTurno}
        </p>
      )}

      {/* Materias intercambiables (chocan de horario pero no bloquean nada) */}
      {Array.isArray(intercambiables) && intercambiables.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {intercambiables.map((alt) => (
            <div key={alt.materiaId} className="flex items-start gap-2">
              <span className="text-[11px] text-teal-400/80 leading-tight flex-1">
                ⇄ Se puede intercambiar con <span className="font-medium">{alt.nombre}</span>
                {' '}({cuatriLabelCorto(alt.cuatrimestre, cuatrimestreInicio, baseYear)}) — chocan de
                horario pero ninguna bloquea otras materias
              </span>
              {onIntercambiar && (
                <button
                  onClick={(e) => { e.stopPropagation(); onIntercambiar(materiaId, alt.materiaId) }}
                  className="shrink-0 text-[11px] px-2 py-0.5 rounded-md border border-teal-500/40 text-teal-300 hover:bg-teal-500/15 transition-colors cursor-pointer"
                >
                  Intercambiar
                </button>
              )}
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
    neutral: 'bg-neutral-800/50 text-neutral-500 border-neutral-700/50',
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    fuchsia: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
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
