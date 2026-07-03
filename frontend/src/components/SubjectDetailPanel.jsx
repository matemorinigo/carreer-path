import { motion, AnimatePresence } from 'framer-motion'
import planEstudios from '../data/planEstudios.json'

const statusLabels = {
  completed: { text: 'Aprobada', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  available: { text: 'Disponible', color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30' },
  simulated: { text: 'Simulada (provisorio)', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  locked: { text: 'Bloqueada', color: 'text-neutral-400 bg-neutral-700/30 border-neutral-600/30' },
}

const planMap = new Map(planEstudios.map(s => [s.id, s]))

export default function SubjectDetailPanel({ nodeData, completionSet, onClose, onNavigate }) {
  return (
    <AnimatePresence>
      {nodeData && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-[360px] max-w-[90vw] bg-neutral-950/95 backdrop-blur-xl border-l border-neutral-800 z-50 overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-bold text-white leading-tight">
                  {nodeData.completedChild ? nodeData.completedChild.nombre : nodeData.subject.nombre}
                </h2>
                <button
                  onClick={onClose}
                  className="shrink-0 w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="text-neutral-400 text-sm">✕</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-1 rounded-lg border ${statusLabels[nodeData.status].color}`}>
                  {statusLabels[nodeData.status].text}
                </span>
                <span className="text-xs px-2 py-1 rounded-lg border border-neutral-700 text-neutral-400 bg-neutral-800/50">
                  Código: {nodeData.subject.id}
                </span>
                {nodeData.subject.horas && (
                  <span className="text-xs px-2 py-1 rounded-lg border border-neutral-700 text-neutral-400 bg-neutral-800/50">
                    {nodeData.subject.horas} horas
                  </span>
                )}
                {nodeData.subject.esTransversal && (
                  <span className="text-xs px-2 py-1 rounded-lg border border-sky-500/30 text-sky-400 bg-sky-500/10">
                    Transversal
                  </span>
                )}
              </div>

              {(nodeData.status === 'available' || nodeData.status === 'simulated') && (
                <button
                  onClick={() => nodeData.onToggleSimulate?.(nodeData.subject.id)}
                  className={`w-full text-sm px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                    nodeData.status === 'simulated'
                      ? 'border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20'
                      : 'border-neutral-700 text-neutral-300 bg-neutral-800/50 hover:bg-neutral-700'
                  }`}
                >
                  {nodeData.status === 'simulated'
                    ? 'Quitar simulación'
                    : 'Marcar como cursada (provisorio)'}
                </button>
              )}

              {nodeData.status === 'completed' && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                  {(nodeData.completedChild?.nota ?? nodeData.nota) != null && (
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-400">Nota</span>
                      <span className="text-lg font-bold text-emerald-400">
                        {nodeData.completedChild?.nota ?? nodeData.nota}
                      </span>
                    </div>
                  )}
                  {nodeData.fecha && (
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-400">Fecha</span>
                      <span className="text-sm text-neutral-300">{nodeData.fecha}</span>
                    </div>
                  )}
                  {nodeData.origen && (
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-400">Origen</span>
                      <span className="text-sm text-neutral-300">{nodeData.origen}</span>
                    </div>
                  )}
                </div>
              )}

              {nodeData.subject.correlativas.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Correlativas ({nodeData.subject.correlativas.length})
                  </h3>
                  <div className="space-y-2">
                    {nodeData.subject.correlativas.map(prereqId => {
                      const prereq = planMap.get(prereqId)
                      if (!prereq) return null
                      const isCompleted = completionSet.has(prereqId)
                      return (
                        <button
                          key={prereqId}
                          onClick={() => onNavigate(prereqId)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-neutral-900/50 border-neutral-700/40 hover:bg-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${isCompleted ? 'text-emerald-400' : 'text-neutral-500'}`}>
                              {isCompleted ? '✓' : '○'}
                            </span>
                            <span className={`text-sm ${isCompleted ? 'text-emerald-300' : 'text-neutral-400'}`}>
                              {prereq.nombre}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {(() => {
                const dependents = planEstudios.filter(s =>
                  s.correlativas.includes(nodeData.subject.id) && !s.padreId
                )
                if (dependents.length === 0) return null
                return (
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Habilita ({dependents.length})
                    </h3>
                    <div className="space-y-2">
                      {dependents.map(dep => {
                        const isCompleted = completionSet.has(dep.id)
                        return (
                          <button
                            key={dep.id}
                            onClick={() => onNavigate(dep.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                              isCompleted
                                ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-neutral-900/50 border-neutral-700/40 hover:bg-neutral-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-xs ${isCompleted ? 'text-emerald-400' : 'text-neutral-500'}`}>
                                {isCompleted ? '✓' : '○'}
                              </span>
                              <span className={`text-sm ${isCompleted ? 'text-emerald-300' : 'text-neutral-400'}`}>
                                {dep.nombre}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {nodeData.electiveChildren?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Opciones de electiva
                  </h3>
                  <div className="space-y-2">
                    {nodeData.electiveChildren.map(child => {
                      const isCompleted = completionSet.has(child.id)
                      return (
                        <div
                          key={child.id}
                          className={`px-3 py-2.5 rounded-lg border ${
                            isCompleted
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : 'bg-neutral-900/50 border-neutral-700/40'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${isCompleted ? 'text-emerald-400' : 'text-neutral-500'}`}>
                              {isCompleted ? '✓' : '○'}
                            </span>
                            <span className={`text-sm ${isCompleted ? 'text-emerald-300' : 'text-neutral-400'}`}>
                              {child.nombre}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
