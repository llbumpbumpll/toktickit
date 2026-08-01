import { useState } from 'react'

const API_BASE_URL = 'http://localhost:5080'

type CheckState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'online'; service: string }
  | { phase: 'error'; message: string }

function App() {
  const [check, setCheck] = useState<CheckState>({ phase: 'idle' })

  const checkSystem = async () => {
    setCheck({ phase: 'loading' })
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`)
      if (!res.ok) throw new Error(`Backend responded with status ${res.status}`)
      const data = await res.json()
      setCheck({ phase: 'online', service: data.service })
    } catch {
      setCheck({
        phase: 'error',
        message: 'Unable to reach the backend. Please check that the server is running and try again.',
      })
    }
  }

  return (
    <div className="container mt-5">
      <div className="card shadow-sm p-4 text-center" style={{ maxWidth: '500px', margin: 'auto' }}>
        <h1 className="text-primary mb-3">TokTickIT</h1>
        <p className="lead">IT Service Desk</p>
        <button className="btn btn-primary" onClick={checkSystem} disabled={check.phase === 'loading'}>
          Check System
        </button>

        {check.phase === 'loading' && (
          <p className="mt-3 text-muted" role="status">
            ⏳ Loading...
          </p>
        )}
        {check.phase === 'online' && (
          <p className="mt-3 text-success" role="status">
            System Status: Online ({check.service})
          </p>
        )}
        {check.phase === 'error' && (
          <p className="mt-3 text-danger" role="alert">
            {check.message}
          </p>
        )}
      </div>
    </div>
  )
}

export default App
