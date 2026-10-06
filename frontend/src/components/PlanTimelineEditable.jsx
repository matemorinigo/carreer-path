import { useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import CuatrimestreCard from './CuatrimestreCard'
import MateriaCard from './MateriaCard'
import { evaluarMovimiento } from '../planner/moverMateria'

// Timeline del plan donde se pueden arrastrar materias entre cuatrimestres.
// Al empezar a arrastrar se evalúa cada cuatrimestre destino (correlativas y
// horarios) para marcar dónde se puede soltar y por qué no en el resto.
export default function PlanTimelineEditable({
  plan,
  ctx,
  baseYear,
  cuatrimestreInicio,
  ofertaFieldVisibility,
  onMover,
  onIntercambiar,
  onDeshacer,
  onRestaurar,
  puedeDeshacer,
}) {
  const [activeId, setActiveId] = useState(null)
  const [evaluaciones, setEvaluaciones] = useState(null)
  const [aviso, setAviso] = useState(null)
  const avisoTimer = useRef(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // En touch hay que mantener apretado para no pelearse con el scroll.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  )

  const cuatris = plan.cuatrimestres
  const activeCard = activeId
    ? cuatris.flatMap((c) => c.materias).find((m) => m.materiaId === activeId)
    : null

  function mostrarAviso(texto) {
    clearTimeout(avisoTimer.current)
    setAviso(texto)
    avisoTimer.current = setTimeout(() => setAviso(null), 4000)
  }

  function handleDragStart({ active }) {
    setActiveId(active.id)
    setEvaluaciones(
      Array.from({ length: cuatris.length + 1 }, (_, i) => evaluarMovimiento(plan, active.id, i, ctx)),
    )
  }

  function handleDragEnd({ active, over }) {
    const destino = over?.data.current?.index
    const ev = destino != null ? evaluaciones?.[destino] : null
    if (ev?.ok) onMover(active.id, destino)
    else if (ev?.motivo) mostrarAviso(ev.motivo)
    setActiveId(null)
    setEvaluaciones(null)
  }

  function handleDragCancel() {
    setActiveId(null)
    setEvaluaciones(null)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-wrap items-center gap-3 bg-neutral-900/40 border border-neutral-800 rounded-xl px-4 py-3 mb-6">
        <p className="text-xs text-neutral-500 flex-1 min-w-48">
          Arrastrá una materia a otro cuatrimestre para reacomodar el plan (en el celu, mantené apretado).
          Se respetan correlativas y horarios.
        </p>
        {puedeDeshacer && (
          <div className="flex gap-2">
            <button
              onClick={onDeshacer}
              className="text-xs px-3 py-1.5 rounded-lg bg-neutral-800/70 hover:bg-neutral-800 text-neutral-300 transition-colors cursor-pointer"
            >
              Deshacer
            </button>
            <button
              onClick={onRestaurar}
              className="text-xs px-3 py-1.5 rounded-lg bg-neutral-800/70 hover:bg-neutral-800 text-neutral-400 transition-colors cursor-pointer"
            >
              Volver al plan original
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {cuatris.map((cuatri, index) => (
          <CuatrimestreDroppable
            key={cuatri.numero}
            index={index}
            evaluacion={evaluaciones?.[index]}
            cuatrimestre={cuatri}
            baseYear={baseYear}
            cuatrimestreInicio={cuatrimestreInicio}
            ofertaFieldVisibility={ofertaFieldVisibility}
            renderMateria={(materia) => (
              <MateriaDraggable key={materia.materiaId} materia={materia}>
                <MateriaCard
                  materia={materia}
                  ofertaFieldVisibility={ofertaFieldVisibility}
                  onIntercambiar={onIntercambiar}
                  cuatrimestreInicio={cuatrimestreInicio}
                  baseYear={baseYear}
                />
              </MateriaDraggable>
            )}
          />
        ))}

        {activeId && (
          <NuevoCuatrimestreDroppable index={cuatris.length} evaluacion={evaluaciones?.[cuatris.length]} />
        )}
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="rotate-2 shadow-2xl shadow-black/50 rounded-xl bg-neutral-950">
            <MateriaCard
              materia={activeCard}
              ofertaFieldVisibility={ofertaFieldVisibility}
              cuatrimestreInicio={cuatrimestreInicio}
              baseYear={baseYear}
            />
          </div>
        )}
      </DragOverlay>

      {aviso && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] bg-red-950/90 border border-red-500/40 text-red-200 text-sm px-4 py-3 rounded-xl shadow-lg backdrop-blur">
          No se puede mover ahí: {aviso}
        </div>
      )}
    </DndContext>
  )
}

function dropStatusDe(evaluacion, isOver) {
  if (!evaluacion) return null
  if (evaluacion.ok) return isOver ? 'okOver' : 'ok'
  if (evaluacion.motivo == null) return null // cuatrimestre de origen
  return isOver ? 'bloqueadoOver' : 'bloqueado'
}

function CuatrimestreDroppable({ index, evaluacion, ...props }) {
  const { setNodeRef, isOver } = useDroppable({ id: `cuatri-${index}`, data: { index } })
  return (
    <CuatrimestreCard
      {...props}
      dropRef={setNodeRef}
      dropStatus={dropStatusDe(evaluacion, isOver)}
      dropMotivo={isOver && evaluacion && !evaluacion.ok ? evaluacion.motivo : null}
    />
  )
}

function NuevoCuatrimestreDroppable({ index, evaluacion }) {
  const { setNodeRef, isOver } = useDroppable({ id: `cuatri-${index}`, data: { index } })
  const ok = evaluacion?.ok
  return (
    <div className="pl-14">
      <div
        ref={setNodeRef}
        className={`border-2 border-dashed rounded-xl p-6 text-center text-sm transition-colors ${
          ok
            ? isOver ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300' : 'border-emerald-500/40 text-emerald-400/70'
            : isOver ? 'border-red-500/60 text-red-400' : 'border-neutral-800 text-neutral-600'
        }`}
      >
        + Nuevo cuatrimestre al final
        {isOver && !ok && evaluacion?.motivo && (
          <p className="text-xs mt-1">✕ {evaluacion.motivo}</p>
        )}
      </div>
    </div>
  )
}

function MateriaDraggable({ materia, children }) {
  const fija = materia.anual
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: materia.materiaId,
    disabled: fija,
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={fija ? 'Las materias anuales no se pueden mover' : 'Arrastrá para mover de cuatrimestre'}
      className={`touch-manipulation ${fija ? '' : 'cursor-grab active:cursor-grabbing'} ${isDragging ? 'opacity-30' : ''}`}
    >
      {children}
    </div>
  )
}
