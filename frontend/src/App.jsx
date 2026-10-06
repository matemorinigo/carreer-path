import { useMemo, useState } from 'react'
import HistoriaUpload from './components/HistoriaUpload'
import PlanView from './components/PlanView'
import NetworkMap from './components/NetworkMap'
import cazadorImg from './assets/alfaro.jpeg'
import { getCuatrimestreInicioActual } from './utils/cuatrimestre'
import { swapMaterias } from './utils/intercambioPlan'
import { generarPlan, crearContexto } from './planner/planificador'
import { moverMateria, normalizarIntercambiables } from './planner/moverMateria'

const CAZADOR_STORAGE_KEY = 'cazador-utopias-state'

function loadCazadorState() {
  try {
    const raw = localStorage.getItem(CAZADOR_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCazadorState(state) {
  localStorage.setItem(CAZADOR_STORAGE_KEY, JSON.stringify(state))
}

function clearCazadorState() {
  localStorage.removeItem(CAZADOR_STORAGE_KEY)
}

export default function App() {
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState(null)
  const [cazadorMode, setCazadorMode] = useState(false)
  const [cazadorState, setCazadorState] = useState(null)
  const [resumePrompt, setResumePrompt] = useState(loadCazadorState)
  const [lastGenParams, setLastGenParams] = useState(null)
  const [viewMode, setViewMode] = useState('plan')
  // Planes previos a cada cambio manual (drag & drop / intercambio), para deshacer.
  const [planesPrevios, setPlanesPrevios] = useState([])

  const ctx = useMemo(() => (lastGenParams ? crearContexto(lastGenParams) : null), [lastGenParams])

  function calcularPlan(historia, maxMaterias, turnos, ofertaCustom, cuatrimestreInicio = 1) {
    try {
      return generarPlan({ historia, maxMaterias, turnos, ofertaCustom, cuatrimestreInicio })
    } catch (err) {
      console.error('Error generando plan', err)
      throw new Error('No se pudo generar el plan. Verificá que la historia académica sea válida.')
    }
  }

  function handleGenerar(historia, maxMaterias, turnos, ofertaCustom) {
    setError(null)
    try {
      const cuatrimestreInicio = getCuatrimestreInicioActual()
      const data = calcularPlan(historia, maxMaterias, turnos, ofertaCustom, cuatrimestreInicio)
      setPlan(data)
      setPlanesPrevios([])
      setLastGenParams({ historia, maxMaterias, turnos, ofertaCustom, cuatrimestreInicio })
      setCazadorMode(false)
      setCazadorState(null)
    } catch (err) {
      setPlan(null)
      setError(err.message)
    }
  }

  function handleActivarCazador() {
    const state = {
      historiaAcumulada: lastGenParams?.historia || [],
      cuatrisResueltos: [],
      maxMaterias: lastGenParams?.maxMaterias || 5,
      turnos: lastGenParams?.turnos || ['manana', 'tarde', 'noche'],
      ofertaCustom: lastGenParams?.ofertaCustom || null,
      cuatrimestreInicio: getCuatrimestreInicioActual(),
    }
    setCazadorMode(true)
    setCazadorState(state)
    setPlanesPrevios([])
    saveCazadorState(state)
  }

  function handleAvanzarCuatri(materiasConResultado) {
    try {
      const aprobadas = materiasConResultado.filter(m => m.aprobada)

      const nuevasHistoria = aprobadas.map(m => ({
        codigo: m.materiaId,
        nombre: m.nombre,
      }))

      const historiaActualizada = [
        ...cazadorState.historiaAcumulada,
        ...nuevasHistoria,
      ]

      const cuatriResuelto = {
        numero: (cazadorState.cuatrisResueltos.length || 0) + 1,
        materias: materiasConResultado,
      }

      const newState = {
        ...cazadorState,
        historiaAcumulada: historiaActualizada,
        cuatrisResueltos: [...cazadorState.cuatrisResueltos, cuatriResuelto],
      }

      const cuatrimestreReal = cazadorState.cuatrimestreInicio + newState.cuatrisResueltos.length

      const data = calcularPlan(
        historiaActualizada,
        newState.maxMaterias,
        newState.turnos,
        newState.ofertaCustom,
        cuatrimestreReal,
      )

      setPlan(data)
      setCazadorState(newState)
      saveCazadorState(newState)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleResumeCazador() {
    const saved = resumePrompt
    setResumePrompt(null)
    setError(null)

    try {
      const cuatrimestreReal = (saved.cuatrimestreInicio || 1) + (saved.cuatrisResueltos?.length || 0)

      const data = calcularPlan(
        saved.historiaAcumulada,
        saved.maxMaterias,
        saved.turnos,
        saved.ofertaCustom,
        cuatrimestreReal,
      )

      setPlan(data)
      setCazadorMode(true)
      setCazadorState(saved)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleDismissResume() {
    setResumePrompt(null)
    clearCazadorState()
  }

  function aplicarCambioManual(nuevoPlan) {
    if (!nuevoPlan || nuevoPlan === plan) return
    setPlanesPrevios((prev) => [...prev, plan])
    setPlan(nuevoPlan)
  }

  function handleIntercambiar(idA, idB) {
    const swapped = swapMaterias(plan, idA, idB)
    aplicarCambioManual(ctx ? normalizarIntercambiables(swapped, ctx) : swapped)
  }

  function handleMover(materiaId, destino) {
    aplicarCambioManual(moverMateria(plan, materiaId, destino, ctx).plan)
  }

  function handleDeshacer() {
    if (planesPrevios.length === 0) return
    setPlan(planesPrevios[planesPrevios.length - 1])
    setPlanesPrevios((prev) => prev.slice(0, -1))
  }

  function handleRestaurar() {
    if (planesPrevios.length === 0) return
    setPlan(planesPrevios[0])
    setPlanesPrevios([])
  }

  function handleReset() {
    setPlan(null)
    setError(null)
    setCazadorMode(false)
    setCazadorState(null)
    setViewMode('plan')
    setPlanesPrevios([])
    clearCazadorState()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-green-950/40 to-neutral-950 text-white">
      <header className="border-b border-green-900/30 backdrop-blur-sm bg-neutral-950/70 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-emerald-400">Syllabus</span>
              {cazadorMode && (
                <span className="text-fuchsia-400 text-sm ml-3 font-normal inline-flex items-center gap-2">
                  <img src={cazadorImg} alt="" className="w-7 h-7 rounded-full object-cover object-top ring-2 ring-fuchsia-500/50" />
                  Cazador de Utopias
                </span>
              )}
            </h1>
            <p className="text-sm text-neutral-500">Optimizador de trayectoria académica</p>
          </div>
          {plan && (
            <button
              onClick={handleReset}
              className="text-sm px-4 py-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Nueva consulta
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Resume prompt */}
        {resumePrompt && !plan && (
          <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl p-6 mb-8">
            <p className="text-fuchsia-300 font-medium mb-1">
              Tenés una sesión del Cazador de Utopias en curso
            </p>
            <p className="text-neutral-500 text-sm mb-4">
              {resumePrompt.cuatrisResueltos.length} cuatrimestre{resumePrompt.cuatrisResueltos.length !== 1 ? 's' : ''} completado{resumePrompt.cuatrisResueltos.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleResumeCazador}
                className="px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 transition-colors text-sm font-medium cursor-pointer"
              >
                Continuar
              </button>
              <button
                onClick={handleDismissResume}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors text-sm text-neutral-400 cursor-pointer"
              >
                Empezar de cero
              </button>
            </div>
          </div>
        )}

        {!plan && (
          <HistoriaUpload onGenerar={handleGenerar} />
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-400 font-medium">Error al generar el plan</p>
            <p className="text-red-300/70 text-sm mt-2">{error}</p>
            <button
              onClick={handleReset}
              className="mt-4 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors text-red-300 text-sm cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {plan && (
          <>
            {!cazadorMode && (
              <div className="flex items-center gap-1 p-1 bg-neutral-900/50 border border-neutral-800 rounded-xl mb-8 w-fit mx-auto">
                <button
                  onClick={() => setViewMode('plan')}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    viewMode === 'plan'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setViewMode('network')}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    viewMode === 'network'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                >
                  Red de materias
                </button>
              </div>
            )}

            {viewMode === 'plan' || cazadorMode ? (
              <PlanView
                plan={plan}
                cazadorMode={cazadorMode}
                cazadorState={cazadorState}
                cuatrimestreInicio={lastGenParams?.cuatrimestreInicio}
                onActivarCazador={handleActivarCazador}
                onAvanzarCuatri={handleAvanzarCuatri}
                onIntercambiar={handleIntercambiar}
                ctx={cazadorMode ? null : ctx}
                onMover={handleMover}
                onDeshacer={handleDeshacer}
                onRestaurar={handleRestaurar}
                puedeDeshacer={planesPrevios.length > 0}
              />
            ) : (
              <NetworkMap historia={lastGenParams?.historia || []} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
