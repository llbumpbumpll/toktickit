import { useState } from 'react'

const API_BASE_URL = 'http://localhost:5080'

type CheckState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'online'; service: string }
  | { phase: 'error'; message: string }

type Category = { id: number; name: string }

type CategoryState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'success'; categories: Category[] }
  | { phase: 'error'; message: string }

function App() {
  const [check, setCheck] = useState<CheckState>({ phase: 'idle' })
  const [categoryState, setCategoryState] = useState<CategoryState>({ phase: 'idle' })

  const checkHealth = async () => {
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

  const loadCategories = async () => {
    setCategoryState({ phase: 'loading' })
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`)
      if (!res.ok) throw new Error(`Backend responded with status ${res.status}`)
      const categories = await res.json()
      setCategoryState({ phase: 'success', categories })
    } catch {
      setCategoryState({
        phase: 'error',
        message: 'Unable to load request categories. Please check that the server is running and try again.',
      })
    }
  }

  const checkSystem = () => {
    checkHealth()
    loadCategories()
  }

  const isChecking = check.phase === 'loading' || categoryState.phase === 'loading'

  return (
    <div className="container mt-5">
      <div className="card shadow-sm p-4 text-center" style={{ maxWidth: '500px', margin: 'auto' }}>
        <h1 className="text-primary mb-3">TokTickIT</h1>
        <p className="lead">IT Service Desk</p>
        <button className="btn btn-primary" onClick={checkSystem} disabled={isChecking}>
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

        {categoryState.phase === 'loading' && (
          <p className="mt-2 text-muted" role="status">
            ⏳ Loading categories...
          </p>
        )}
        {categoryState.phase === 'error' && (
          <p className="mt-2 text-danger" role="alert">
            {categoryState.message}
          </p>
        )}
        {categoryState.phase === 'success' && (
          <div className="mt-3 text-start">
            <p className="mb-1 fw-semibold">Supported Request Categories:</p>
            <ul className="list-unstyled mb-0">
              {categoryState.categories.map((category) => (
                <li key={category.id}>• {category.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
