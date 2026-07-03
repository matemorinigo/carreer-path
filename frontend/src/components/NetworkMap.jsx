import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion } from 'framer-motion'
import SubjectNode from './SubjectNode'
import SubjectDetailPanel from './SubjectDetailPanel'
import useGraphLayout from '../hooks/useGraphLayout'

const nodeTypes = { subject: SubjectNode }

function NetworkMapInner({ historia }) {
  const [simulatedIds, setSimulatedIds] = useState(() => new Set())
  const { nodes: layoutNodes, edges: layoutEdges } = useGraphLayout(historia, simulatedIds)
  const [selectedNode, setSelectedNode] = useState(null)
  const { setCenter } = useReactFlow()

  const toggleSimulate = useCallback((subjectId) => {
    setSimulatedIds(prev => {
      const next = new Set(prev)
      if (next.has(subjectId)) next.delete(subjectId)
      else next.add(subjectId)
      return next
    })
  }, [])

  const nodesWithHandlers = useMemo(
    () => layoutNodes.map(n => ({ ...n, data: { ...n.data, onToggleSimulate: toggleSimulate } })),
    [layoutNodes, toggleSimulate]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(nodesWithHandlers)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges)

  useEffect(() => {
    setNodes(nodesWithHandlers)
  }, [nodesWithHandlers, setNodes])

  useEffect(() => {
    setEdges(layoutEdges)
  }, [layoutEdges, setEdges])

  const completionSet = useMemo(() => {
    const set = new Set()
    for (const entry of (historia || [])) {
      set.add(entry.codigo.replace(/^0+/, ''))
    }
    return set
  }, [historia])

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node.data)
  }, [])

  const handleNavigate = useCallback((nodeId) => {
    const target = nodes.find(n => n.id === nodeId)
    if (target) {
      setCenter(target.position.x + 110, target.position.y + 45, { zoom: 1.2, duration: 800 })
      setSelectedNode(target.data)
    }
  }, [nodes, setCenter])

  const statsCompleted = useMemo(() => {
    return nodes.filter(n => n.data.status === 'completed').length
  }, [nodes])

  const statsAvailable = useMemo(() => {
    return nodes.filter(n => n.data.status === 'available').length
  }, [nodes])

  const statsLocked = useMemo(() => {
    return nodes.filter(n => n.data.status === 'locked').length
  }, [nodes])

  const statsSimulated = simulatedIds.size

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-3"
      >
        <StatPill label="Aprobadas" value={statsCompleted} color="emerald" />
        <StatPill label="Disponibles" value={statsAvailable} color="cyan" />
        {statsSimulated > 0 && <StatPill label="Simuladas" value={statsSimulated} color="amber" />}
        <StatPill label="Bloqueadas" value={statsLocked} color="neutral" />
        <StatPill label="Total" value={nodes.length} color="white" />
        {statsSimulated > 0 && (
          <button
            onClick={() => setSimulatedIds(new Set())}
            className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer"
          >
            Limpiar simulación
          </button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative w-full rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950"
        style={{ height: 'calc(100vh - 240px)', minHeight: '500px' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          className="network-map-flow"
        >
          <Background color="#1a1a1a" gap={20} size={1} />
          <Controls
            className="!bg-neutral-900 !border-neutral-700 !rounded-lg !shadow-xl [&>button]:!bg-neutral-800 [&>button]:!border-neutral-700 [&>button]:!text-neutral-300 [&>button:hover]:!bg-neutral-700"
          />
          <MiniMap
            className="!bg-neutral-900/90 !border-neutral-700 !rounded-lg"
            nodeColor={(node) => {
              if (node.data?.status === 'completed') return '#34d399'
              if (node.data?.status === 'simulated') return '#fbbf24'
              if (node.data?.status === 'available') return '#22d3ee'
              return '#404040'
            }}
            maskColor="rgba(0, 0, 0, 0.7)"
          />
        </ReactFlow>

        <div className="absolute bottom-4 left-4 flex gap-3 text-[10px] text-neutral-500 bg-neutral-950/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-neutral-800">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Aprobada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Simulada (provisorio)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-600" />
            Bloqueada
          </span>
        </div>
      </motion.div>

      <SubjectDetailPanel
        nodeData={selectedNode}
        completionSet={completionSet}
        onClose={() => setSelectedNode(null)}
        onNavigate={handleNavigate}
      />
    </div>
  )
}

function StatPill({ label, value, color }) {
  const colors = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    neutral: 'text-neutral-400 bg-neutral-800/50 border-neutral-700/40',
    white: 'text-white bg-neutral-800/50 border-neutral-700/40',
  }

  return (
    <div className={`px-3 py-1.5 rounded-lg border text-sm ${colors[color]}`}>
      <span className="font-bold mr-1.5">{value}</span>
      <span className="text-xs opacity-70">{label}</span>
    </div>
  )
}

export default function NetworkMap({ historia }) {
  return (
    <ReactFlowProvider>
      <NetworkMapInner historia={historia} />
    </ReactFlowProvider>
  )
}
