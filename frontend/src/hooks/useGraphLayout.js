import { useMemo } from 'react'
import dagre from '@dagrejs/dagre'
import planEstudios from '../data/planEstudios.json'

const NODE_WIDTH = 220
const NODE_HEIGHT = 90
const TRANSVERSAL_OFFSET_X = 300

function buildCompletionMap(historia) {
  const map = new Map()
  for (const entry of historia) {
    const normalized = entry.codigo.replace(/^0+/, '')
    map.set(normalized, entry)
  }
  return map
}

function computeStatus(subject, completionSet, simulatedSet) {
  if (completionSet.has(subject.id)) return 'completed'
  if (simulatedSet.has(subject.id)) return 'simulated'
  const effectiveSet = simulatedSet.size === 0
    ? completionSet
    : new Set([...completionSet, ...simulatedSet])
  if (subject.correlativas.length === 0) return 'available'
  const allPrereqsMet = subject.correlativas.every(id => effectiveSet.has(id))
  return allPrereqsMet ? 'available' : 'locked'
}

function edgeStyle(sourceStatus, targetStatus) {
  const sourceDone = sourceStatus === 'completed' || sourceStatus === 'simulated'
  const targetUnlocked = targetStatus === 'available' || targetStatus === 'simulated' || targetStatus === 'completed'
  const involvesSimulated = sourceStatus === 'simulated' || targetStatus === 'simulated'

  if (!sourceDone || !targetUnlocked) {
    return { stroke: '#404040', strokeWidth: 1.5, opacity: 0.3, animated: false }
  }
  if (sourceStatus === 'completed' && targetStatus === 'completed') {
    return { stroke: '#34d399', strokeWidth: 2.5, opacity: 0.8, animated: false }
  }
  if (involvesSimulated) {
    return { stroke: '#fbbf24', strokeWidth: 2.5, opacity: 0.9, animated: true }
  }
  return { stroke: '#22d3ee', strokeWidth: 2.5, opacity: 0.9, animated: true }
}

function computeDepthMap(subjects) {
  const subjectMap = new Map(subjects.map(s => [s.id, s]))
  const depths = new Map()

  function getDepth(id) {
    if (depths.has(id)) return depths.get(id)
    const subject = subjectMap.get(id)
    if (!subject || subject.correlativas.length === 0) {
      depths.set(id, 0)
      return 0
    }
    const maxParent = Math.max(...subject.correlativas.map(cid => getDepth(cid)))
    const d = maxParent + 1
    depths.set(id, d)
    return d
  }

  subjects.forEach(s => getDepth(s.id))
  return depths
}

export default function useGraphLayout(historia, simulatedIds) {
  return useMemo(() => {
    const completionMap = buildCompletionMap(historia || [])
    const completionSet = new Set(completionMap.keys())
    const simulatedSet = new Set(simulatedIds || [])

    const mainSubjects = planEstudios.filter(s => !s.padreId)
    const childSubjects = planEstudios.filter(s => s.padreId)

    const transversal = mainSubjects.filter(s => s.esTransversal)
    const core = mainSubjects.filter(s => !s.esTransversal)

    const depthMap = computeDepthMap(mainSubjects)

    const g = new dagre.graphlib.Graph()
    g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 120, marginx: 40, marginy: 40 })
    g.setDefaultEdgeLabel(() => ({}))

    core.forEach(s => {
      g.setNode(s.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
    })

    core.forEach(s => {
      s.correlativas.forEach(prereqId => {
        if (g.hasNode(prereqId)) {
          g.setEdge(prereqId, s.id)
        }
      })
    })

    dagre.layout(g)

    const nodes = []
    const edges = []

    core.forEach(s => {
      const pos = g.node(s.id)
      const status = computeStatus(s, completionSet, simulatedSet)
      const histEntry = completionMap.get(s.id)
      const depth = depthMap.get(s.id) || 0

      const electiveChildren = childSubjects.filter(c => c.padreId === s.id)
      const completedChild = electiveChildren.find(c => completionSet.has(c.id))

      nodes.push({
        id: s.id,
        type: 'subject',
        position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
        data: {
          subject: s,
          status,
          nota: histEntry?.nota,
          fecha: histEntry?.fecha,
          origen: histEntry?.origen,
          depth,
          electiveChildren,
          completedChild: completedChild ? {
            nombre: completedChild.nombre,
            nota: completionMap.get(completedChild.id)?.nota,
          } : null,
        },
      })

      s.correlativas.forEach(prereqId => {
        if (g.hasNode(prereqId)) {
          const sourceStatus = computeStatus(
            planEstudios.find(p => p.id === prereqId),
            completionSet,
            simulatedSet
          )
          const { animated, ...style } = edgeStyle(sourceStatus, status)

          edges.push({
            id: `${prereqId}-${s.id}`,
            source: prereqId,
            target: s.id,
            type: 'smoothstep',
            animated,
            style,
          })
        }
      })
    })

    const maxCoreX = Math.max(...nodes.map(n => n.position.x)) + NODE_WIDTH
    let transY = 0

    transversal.forEach(s => {
      const status = computeStatus(s, completionSet, simulatedSet)
      const histEntry = completionMap.get(s.id)
      const depth = depthMap.get(s.id) || 0

      nodes.push({
        id: s.id,
        type: 'subject',
        position: { x: maxCoreX + TRANSVERSAL_OFFSET_X, y: transY },
        data: {
          subject: s,
          status,
          nota: histEntry?.nota,
          fecha: histEntry?.fecha,
          origen: histEntry?.origen,
          depth,
          isTransversal: true,
        },
      })

      s.correlativas.forEach(prereqId => {
        const prereqSubj = planEstudios.find(p => p.id === prereqId)
        if (!prereqSubj) return
        const sourceStatus = computeStatus(prereqSubj, completionSet, simulatedSet)
        const { animated, ...style } = edgeStyle(sourceStatus, status)

        edges.push({
          id: `${prereqId}-${s.id}`,
          source: prereqId,
          target: s.id,
          type: 'smoothstep',
          animated,
          style,
        })
      })

      transY += NODE_HEIGHT + 40
    })

    return { nodes, edges, planEstudios: mainSubjects }
  }, [historia, simulatedIds])
}
