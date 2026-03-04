import { useState } from 'react'
import HistoriaUpload from './components/HistoriaUpload'
import PlanView from './components/PlanView'

const BASE_URL = import.meta.env.VITE_API_URL || ''
const API_URL = `${BASE_URL}/api/planificador/generar`

export default function App() {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGenerar(historia, maxMaterias) {
    setLoading(true)
    setError(null)
    setPlan(null)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historia, maxMaterias }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Error ${res.status}: ${text}`)
      }

      const data = await res.json()
      setPlan(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setPlan(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-indigo-400">Career</span>Path
            </h1>
            <p className="text-sm text-slate-400">Optimizador de trayectoria académica</p>
          </div>
          {plan && (
            <button
              onClick={handleReset}
              className="text-sm px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Nueva consulta
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {!plan && !loading && (
          <HistoriaUpload onGenerar={handleGenerar} />
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            <p className="text-slate-400">Generando plan óptimo...</p>
          </div>
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

        {plan && <PlanView plan={plan} />}
      </main>
    </div>
  )
}
