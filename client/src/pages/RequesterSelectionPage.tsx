import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Field } from '../components/Field'
import { Button } from '../components/Button'
import { API_BASE_URL } from '../lib/api'
import { setStoredRequester, type StoredRequester } from '../lib/requesterSession'

type LoadState = 'loading' | 'loaded' | 'empty' | 'failure'

/**
 * Route: /select-requester (FR-01, ui-spec.md §5). Testing-only identity
 * switch -- not a login screen (BR-03).
 */
export function RequesterSelectionPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<LoadState>('loading')
  const [requesters, setRequesters] = useState<StoredRequester[]>([])
  const [selectedId, setSelectedId] = useState<string>('')

  const loadRequesters = () => {
    setState('loading')
    fetch(`${API_BASE_URL}/requesters`)
      .then((res) => {
        if (!res.ok) throw new Error('Request failed')
        return res.json()
      })
      .then((data: StoredRequester[]) => {
        setRequesters(data)
        setState(data.length === 0 ? 'empty' : 'loaded')
      })
      .catch(() => {
        setState('failure')
      })
  }

  useEffect(() => {
    loadRequesters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleContinue = () => {
    const requester = requesters.find((r) => String(r.id) === selectedId)
    if (!requester) return
    setStoredRequester(requester)
    navigate('/tickets')
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: 'var(--zg-bg)' }}>
      <div className="card zg-surface p-4 shadow-sm" style={{ maxWidth: '480px', width: '100%' }}>
        <h1 className="h3 mb-3" style={{ color: 'var(--zg-primary)' }}>
          TokTickIT
        </h1>
        <h2 className="h5 mb-3">Development Requester Selection</h2>
        <p className="text-body-secondary">
          Select a Development Requester to test requester-specific ticket behavior. This is not a login screen.
          Authentication and role-based access will be introduced in Lab 3.
        </p>

        {state === 'loading' && (
          <div className="d-flex align-items-center gap-2 py-3" role="status">
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
            <span>Loading Requesters…</span>
          </div>
        )}

        {state === 'failure' && (
          <div className="alert d-flex flex-column gap-2" style={{ color: 'var(--zg-error)', borderColor: 'var(--zg-error)' }} role="alert">
            <span>Unable to load Requesters.</span>
            <Button variant="secondary" type="button" onClick={loadRequesters} className="align-self-start">
              Retry
            </Button>
          </div>
        )}

        {state === 'empty' && (
          <div className="alert" style={{ color: 'var(--zg-warning)', borderColor: 'var(--zg-warning)' }} role="alert">
            No active Development Requesters are available. Contact your instructor.
          </div>
        )}

        {state === 'loaded' && (
          <Field label="Development Requester" required>
            {(fieldProps) => (
              <select
                {...fieldProps}
                className="form-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                <option value="">Select a Requester…</option>
                {requesters.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.email})
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}

        <Button
          type="button"
          variant="primary"
          className="w-100 mt-2"
          disabled={state !== 'loaded' || !selectedId}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
