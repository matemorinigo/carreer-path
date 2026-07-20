import CuatrimestreCard from './CuatrimestreCard'
import CazadorCuatrimestreActivo from './CazadorCuatrimestreActivo'
import CazadorHistorial from './CazadorHistorial'
import cazadorImg from '../assets/alfaro.jpeg'

function getBaseYear() {
  const now = new Date()
  const month = now.getMonth()
  return month >= 6 ? now.getFullYear() + 1 : now.getFullYear()
}

function hasValue(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

function buildOfertaFieldVisibility(plan) {
  const materias = (plan.cuatrimestres || []).flatMap((c) => c.materias || [])

  return {
    comisionId: materias.some((m) => hasValue(m.comisionId)),
    modalidad: materias.some((m) => hasValue(m.modalidad)),
    sede: materias.some((m) => hasValue(m.sede)),
  }
}

export default function PlanView({
  plan,
  cazadorMode,
  cazadorState,
  onActivarCazador,
  onAvanzarCuatri,
  cazadorLoading,
}) {
  const baseYear = getBaseYear()
  const ofertaFieldVisibility = buildOfertaFieldVisibility(plan)

  const totalMateriasPendientes = (plan.cuatrimestres || []).reduce(
    (sum, c) => sum + (c.materias?.length || 0), 0
  )

  if (cazadorMode && cazadorState) {
    const cuatriActual = plan.cuatrimestres?.[0]
    const cuatriNumeroActual = cuatriActual
      ? cuatriActual.numero + (cazadorState.cuatrisResueltos?.length || 0)
      : null

    return (
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Cuatrimestres restantes"
            value={plan.totalCuatrimestres}
            color="green"
          />
          <StatCard
            label="Aprobadas hasta ahora"
            value={plan.materiasCompletadas}
            color="emerald"
          />
          <StatCard
            label="Pendientes"
            value={totalMateriasPendientes}
            color={totalMateriasPendientes === 0 ? 'emerald' : 'amber'}
          />
        </div>

        {!cuatriActual && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
            <p className="text-emerald-400 font-medium text-lg">
              Terminaste la carrera, cazador de utopias!
            </p>
          </div>
        )}

        <CazadorHistorial
          cuatrisResueltos={cazadorState.cuatrisResueltos || []}
          baseYear={baseYear}
        />

        {cuatriActual && (
          <CazadorCuatrimestreActivo
            key={cuatriNumeroActual}
            cuatrimestre={{
              ...cuatriActual,
              numero: cuatriNumeroActual,
            }}
            baseYear={baseYear}
            ofertaFieldVisibility={ofertaFieldVisibility}
            onAvanzar={onAvanzarCuatri}
            loading={cazadorLoading}
          />
        )}

        {/* Future semesters preview */}
        {plan.cuatrimestres.length > 1 && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
              Cuatrimestres futuros (estimados)
            </h3>
            <div className="opacity-40 space-y-6">
              {plan.cuatrimestres.slice(1).map((cuatri) => (
                <CuatrimestreCard
                  key={cuatri.numero}
                  cuatrimestre={{
                    ...cuatri,
                    numero: cuatri.numero + (cazadorState.cuatrisResueltos?.length || 0),
                  }}
                  baseYear={baseYear}
                  ofertaFieldVisibility={ofertaFieldVisibility}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Cuatrimestres"
          value={plan.totalCuatrimestres}
          color="green"
        />
        <StatCard
          label="Materias ya aprobadas"
          value={plan.materiasCompletadas}
          color="emerald"
        />
        <StatCard
          label="Pendientes"
          value={totalMateriasPendientes}
          color={totalMateriasPendientes === 0 ? 'emerald' : 'amber'}
        />
      </div>

      {totalMateriasPendientes === 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
          <p className="text-emerald-400 font-medium">
            Todas las materias quedan cubiertas en {plan.totalCuatrimestres} cuatrimestres
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
        <p className="text-amber-400 text-sm font-medium">
          CUIDADO: Este plan está estimado y es válido solo si no te cagan de ningún lado. Lo más probable es que te caguen. Siempre te cagan.
        </p>
      </div>

      {/* Cazador button */}
      {plan.cuatrimestres?.length > 0 && onActivarCazador && (
        <div
          onClick={onActivarCazador}
          className="relative overflow-hidden rounded-xl border border-fuchsia-500/30 cursor-pointer group transition-all hover:border-fuchsia-500/60 hover:shadow-lg hover:shadow-fuchsia-500/10"
        >
          <div className="absolute inset-0">
            <img src={cazadorImg} alt="" className="w-full h-full object-cover object-top opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-950/80 via-neutral-950/70 to-violet-950/80" />
          </div>
          <div className="relative px-8 py-6 flex items-center gap-5">
            <img src={cazadorImg} alt="" className="w-16 h-16 rounded-full object-cover object-top ring-2 ring-fuchsia-500/50 shrink-0" />
            <div>
              <p className="text-fuchsia-300 font-semibold text-base">Activar Cazador de Utopias Imposibles</p>
              <p className="text-neutral-500 text-sm mt-1">
                Avanzá cuatri por cuatri marcando lo que aprobaste de verdad
              </p>
            </div>
            <span className="ml-auto text-fuchsia-400/60 text-2xl group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-6">
        {plan.cuatrimestres.map((cuatri) => (
          <CuatrimestreCard
            key={cuatri.numero}
            cuatrimestre={cuatri}
            baseYear={baseYear}
            ofertaFieldVisibility={ofertaFieldVisibility}
          />
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  const colorMap = {
    green: 'from-green-500/20 to-green-500/5 border-green-500/30 text-green-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-5 text-center`}>
      <p className={`text-3xl font-bold ${colorMap[color].split(' ').pop()}`}>{value}</p>
      <p className="text-sm text-neutral-500 mt-1">{label}</p>
    </div>
  )
}
