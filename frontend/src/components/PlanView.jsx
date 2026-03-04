import CuatrimestreCard from './CuatrimestreCard'

export default function PlanView({ plan }) {
  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Cuatrimestres"
          value={plan.totalCuatrimestres}
          color="indigo"
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

      {/* Timeline */}
      <div className="space-y-6">
        {plan.cuatrimestres.map((cuatri) => (
          <CuatrimestreCard key={cuatri.numero} cuatrimestre={cuatri} />
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 text-indigo-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
  }

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-5 text-center`}>
      <p className={`text-3xl font-bold ${colorMap[color].split(' ').pop()}`}>{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
    </div>
  )
}
