import CuatrimestreCard from './CuatrimestreCard'

function getBaseYear() {
  const now = new Date()
  const month = now.getMonth()
  return month >= 7 ? now.getFullYear() + 1 : now.getFullYear()
}

export default function PlanView({ plan }) {
  const baseYear = getBaseYear()

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
          value={plan.materiasPendientes}
          color={plan.materiasPendientes === 0 ? 'emerald' : 'amber'}
        />
      </div>

      {plan.materiasPendientes === 0 && (
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

      {/* Timeline */}
      <div className="space-y-6">
        {plan.cuatrimestres.map((cuatri) => (
          <CuatrimestreCard key={cuatri.numero} cuatrimestre={cuatri} baseYear={baseYear} />
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
