import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'

const statusConfig = {
  completed: {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/60',
    text: 'text-emerald-300',
    shadow: 'shadow-emerald-500/20',
    icon: '✓',
    iconBg: 'bg-emerald-500',
  },
  available: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/50',
    text: 'text-cyan-300',
    shadow: 'shadow-cyan-500/15',
    icon: '→',
    iconBg: 'bg-cyan-500',
  },
  simulated: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-400/60 border-dashed',
    text: 'text-amber-300',
    shadow: 'shadow-amber-500/15',
    icon: '?',
    iconBg: 'bg-amber-500',
  },
  locked: {
    bg: 'bg-neutral-900/60',
    border: 'border-neutral-700/40',
    text: 'text-neutral-500',
    shadow: '',
    icon: '🔒',
    iconBg: 'bg-neutral-700',
  },
}

function SubjectNode({ data }) {
  const { subject, status, nota, depth, isTransversal, completedChild, onToggleSimulate } = data
  const config = statusConfig[status]
  const delay = (depth || 0) * 0.12 + Math.random() * 0.05

  const displayName = completedChild ? completedChild.nombre : subject.nombre
  const displayNota = completedChild ? completedChild.nota : nota
  const canSimulate = status === 'available' || status === 'simulated'

  const handleToggle = (e) => {
    e.stopPropagation()
    onToggleSimulate?.(subject.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 180, damping: 20 }}
      className="relative"
    >
      <Handle type="target" position={Position.Top} className="!bg-neutral-600 !w-2 !h-2 !border-0" />

      <motion.div
        whileHover={{ scale: 1.08, zIndex: 50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`
          ${config.bg} ${config.border} ${config.shadow}
          border rounded-xl px-4 py-3 w-[220px] cursor-pointer
          backdrop-blur-sm transition-shadow duration-300
          ${status === 'available' ? 'shadow-lg' : 'shadow-md'}
        `}
      >
        {status === 'available' && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-cyan-400/40"
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.02, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {status === 'simulated' && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-amber-400/40"
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.02, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {status === 'completed' && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            animate={{
              boxShadow: [
                '0 0 10px 0px rgba(52, 211, 153, 0.1)',
                '0 0 20px 2px rgba(52, 211, 153, 0.15)',
                '0 0 10px 0px rgba(52, 211, 153, 0.1)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <div className="relative flex items-start gap-2.5">
          {canSimulate ? (
            <button
              onClick={handleToggle}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              title={status === 'simulated' ? 'Quitar simulación' : 'Marcar como cursada (provisorio)'}
              className={`nodrag nopan ${config.iconBg} shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 cursor-pointer hover:scale-110 transition-transform`}
            >
              <span className="text-white text-xs font-bold">{status === 'simulated' ? '✓' : config.icon}</span>
            </button>
          ) : (
            <div className={`${config.iconBg} shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5`}>
              <span className="text-white text-xs font-bold">{config.icon}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold leading-tight ${config.text} line-clamp-2`}>
              {displayName}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-neutral-600">{subject.id}</span>
              {subject.horas && (
                <span className="text-[10px] text-neutral-600">{subject.horas}hs</span>
              )}
              {isTransversal && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Transv.
                </span>
              )}
              {!subject.esObligatoria && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  Electiva
                </span>
              )}
              {status === 'simulated' && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Provisorio
                </span>
              )}
            </div>
            {status === 'completed' && displayNota != null && (
              <div className="mt-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 font-medium">
                  Nota: {displayNota}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <Handle type="source" position={Position.Bottom} className="!bg-neutral-600 !w-2 !h-2 !border-0" />
    </motion.div>
  )
}

export default memo(SubjectNode)
