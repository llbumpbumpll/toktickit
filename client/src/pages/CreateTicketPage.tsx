import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Field } from '../components/Field'
import { Button } from '../components/Button'
import { AttachmentPicker } from '../components/AttachmentPicker'
import { API_BASE_URL } from '../lib/api'
import { getStoredRequester } from '../lib/requesterSession'
import { uploadAttachment } from '../lib/uploadAttachment'
import { validateAttachmentFile, type AttachmentChip } from '../lib/attachments'

type ReferenceItem = { id: number; name: string }
type RefState = 'loading' | 'loaded' | 'failure'
type SubmitState = 'idle' | 'submitting' | 'success'
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const SUMMARY_MAX = 150
const DESCRIPTION_MAX = 5000

type SuccessData = { id: number; ticketNumber: string; failedAttachments: string[] }

/** Route: /tickets/new (FR-03, ui-spec.md §6). */
export function CreateTicketPage() {
  const navigate = useNavigate()
  const requester = getStoredRequester()!

  const [refState, setRefState] = useState<RefState>('loading')
  const [categories, setCategories] = useState<ReferenceItem[]>([])
  const [relatedSystems, setRelatedSystems] = useState<ReferenceItem[]>([])

  const [categoryId, setCategoryId] = useState('')
  const [relatedSystemId, setRelatedSystemId] = useState('')
  const [priority, setPriority] = useState<Priority | ''>('')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState<AttachmentChip[]>([])

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [successData, setSuccessData] = useState<SuccessData | null>(null)

  const loadReferenceData = () => {
    setRefState('loading')
    Promise.all([
      fetch(`${API_BASE_URL}/categories`).then((res) => {
        if (!res.ok) throw new Error('Request failed')
        return res.json() as Promise<ReferenceItem[]>
      }),
      fetch(`${API_BASE_URL}/related-systems`).then((res) => {
        if (!res.ok) throw new Error('Request failed')
        return res.json() as Promise<ReferenceItem[]>
      }),
    ])
      .then(([categoryData, relatedSystemData]) => {
        setCategories(categoryData)
        setRelatedSystems(relatedSystemData)
        setRefState('loaded')
      })
      .catch(() => setRefState('failure'))
  }

  useEffect(() => {
    loadReferenceData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addAttachments = (files: FileList) => {
    setAttachments((prev) => {
      const next = [...prev]
      let acceptedCount = next.filter((a) => a.status !== 'invalid').length
      Array.from(files).forEach((file) => {
        const error = validateAttachmentFile(file, acceptedCount)
        const chip: AttachmentChip = {
          clientId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          name: file.name,
          size: file.size,
          status: error ? 'invalid' : 'ready',
          progress: 0,
          errorMessage: error ?? undefined,
        }
        if (!error) acceptedCount += 1
        next.push(chip)
      })
      return next
    })
  }

  const removeAttachment = (clientId: string) => {
    setAttachments((prev) => prev.filter((a) => a.clientId !== clientId))
  }

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!categoryId) errors.categoryId = 'Category is required.'
    if (!relatedSystemId) errors.relatedSystemId = 'Related System is required.'
    if (!priority) errors.requestedPriority = 'Requested Priority is required.'

    const trimmedSummary = summary.trim()
    if (!trimmedSummary) errors.summary = 'Ticket Summary is required.'
    else if (trimmedSummary.length < 5 || trimmedSummary.length > SUMMARY_MAX) {
      errors.summary = `Ticket Summary must be 5-${SUMMARY_MAX} characters.`
    }

    const trimmedDescription = description.trim()
    if (!trimmedDescription) errors.description = 'Description is required.'
    else if (trimmedDescription.length < 10 || trimmedDescription.length > DESCRIPTION_MAX) {
      errors.description = `Description must be 10-${DESCRIPTION_MAX} characters.`
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitState === 'submitting') return // AC-11: guard against duplicate submits

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setApiError(null)
    setSubmitState('submitting')

    try {
      const res = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Dev-Requester-Id': String(requester.id) },
        body: JSON.stringify({
          categoryId: Number(categoryId),
          relatedSystemId: Number(relatedSystemId),
          summary: summary.trim(),
          description: description.trim(),
          requestedPriority: priority,
        }),
      })

      if (res.status === 400) {
        const body = await res.json()
        setFieldErrors(body.error?.fields ?? {})
        setSubmitState('idle')
        return
      }

      if (!res.ok) {
        setApiError('Something went wrong creating your ticket. Please try again.')
        setSubmitState('idle')
        return
      }

      const ticket = await res.json()
      const pending = attachments.filter((a) => a.status === 'ready')
      const failedAttachments: string[] = []

      for (const chip of pending) {
        setAttachments((prev) =>
          prev.map((a) => (a.clientId === chip.clientId ? { ...a, status: 'uploading', progress: 0 } : a)),
        )
        // eslint-disable-next-line no-await-in-loop
        const result = await uploadAttachment(ticket.id, requester.id, chip.file, (percent) => {
          setAttachments((prev) => prev.map((a) => (a.clientId === chip.clientId ? { ...a, progress: percent } : a)))
        })
        if (result.ok) {
          setAttachments((prev) =>
            prev.map((a) => (a.clientId === chip.clientId ? { ...a, status: 'success', progress: 100 } : a)),
          )
        } else {
          failedAttachments.push(chip.name)
          setAttachments((prev) =>
            prev.map((a) => (a.clientId === chip.clientId ? { ...a, status: 'error', errorMessage: result.message } : a)),
          )
        }
      }

      setSuccessData({ id: ticket.id, ticketNumber: ticket.ticketNumber, failedAttachments })
      setSubmitState('success')
    } catch {
      setApiError('Unable to reach the server. Please check your connection and try again.') // BR-20, AC-12
      setSubmitState('idle')
    }
  }

  const resetForm = () => {
    setCategoryId('')
    setRelatedSystemId('')
    setPriority('')
    setSummary('')
    setDescription('')
    setAttachments([])
    setFieldErrors({})
    setApiError(null)
    setSuccessData(null)
    setSubmitState('idle')
  }

  if (refState === 'loading') {
    return (
      <div className="container py-4">
        <div className="d-flex align-items-center gap-2 py-3" role="status">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          <span>Loading form…</span>
        </div>
      </div>
    )
  }

  if (refState === 'failure') {
    return (
      <div className="container py-4">
        <div className="card zg-surface p-4" style={{ maxWidth: '480px' }}>
          <h1 className="h4">Create Ticket</h1>
          <div className="alert d-flex flex-column gap-2" style={{ color: 'var(--zg-error)', borderColor: 'var(--zg-error)' }} role="alert">
            <span>Unable to load Category and Related System options.</span>
            <Button variant="secondary" type="button" onClick={loadReferenceData} className="align-self-start">
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (submitState === 'success' && successData) {
    return (
      <div className="container py-4">
        <div className="card p-4" style={{ backgroundColor: 'var(--zg-pale)', maxWidth: '600px' }}>
          <h1 className="h4" style={{ color: 'var(--zg-success)' }}>
            Ticket created
          </h1>
          <p className="mb-3">
            Your Ticket Number is <strong>{successData.ticketNumber}</strong>.
          </p>

          {successData.failedAttachments.length > 0 && (
            <div className="alert" style={{ color: 'var(--zg-error)', borderColor: 'var(--zg-error)' }} role="alert">
              <p className="mb-1">The following attachments failed to upload:</p>
              <ul className="mb-1">
                {successData.failedAttachments.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <Link to={`/tickets/${successData.id}`}>Retry from Ticket Detail</Link>
            </div>
          )}

          <div className="d-flex gap-2">
            <Button variant="primary" type="button" onClick={() => navigate(`/tickets/${successData.id}`)}>
              View Ticket
            </Button>
            <Button variant="secondary" type="button" onClick={resetForm}>
              Create Another
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const busy = submitState === 'submitting'

  return (
    <div className="container py-4" style={{ maxWidth: '900px' }}>
      <h1 className="h3 mb-3">Create Ticket</h1>

      {apiError && (
        <div className="alert" style={{ color: 'var(--zg-error)', borderColor: 'var(--zg-error)' }} role="alert">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-3 mb-1">
          <div className="col-md-4">
            <Field label="Ticket Number" readOnly hint="Generated after submission">
              {(fieldProps) => (
                <input {...fieldProps} className="form-control zg-field--readonly" readOnly value="" />
              )}
            </Field>
          </div>
          <div className="col-md-4">
            <Field label="Ticket Date" readOnly hint="Set automatically">
              {(fieldProps) => (
                <input {...fieldProps} className="form-control zg-field--readonly" readOnly value="" />
              )}
            </Field>
          </div>
          <div className="col-md-4">
            <Field label="Requester" readOnly>
              {(fieldProps) => (
                <input {...fieldProps} className="form-control zg-field--readonly" readOnly value={requester.name} />
              )}
            </Field>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <Field label="Category" required error={fieldErrors.categoryId}>
              {(fieldProps) => (
                <select
                  {...fieldProps}
                  className="form-select"
                  value={categoryId}
                  disabled={busy}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select a category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <div className="col-md-6">
            <Field label="Related System" required error={fieldErrors.relatedSystemId}>
              {(fieldProps) => (
                <select
                  {...fieldProps}
                  className="form-select"
                  value={relatedSystemId}
                  disabled={busy}
                  onChange={(e) => setRelatedSystemId(e.target.value)}
                >
                  <option value="">Select a related system…</option>
                  {relatedSystems.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        </div>

        <Field label="Requested Priority" required error={fieldErrors.requestedPriority}>
          {(fieldProps) => (
            <select
              {...fieldProps}
              className="form-select"
              value={priority}
              disabled={busy}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="">Select priority</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          label="Ticket Summary"
          required
          error={fieldErrors.summary}
          hint={`${summary.length}/${SUMMARY_MAX}`}
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="text"
              className="form-control"
              value={summary}
              disabled={busy}
              onChange={(e) => setSummary(e.target.value)}
            />
          )}
        </Field>

        <Field
          label="Description"
          required
          error={fieldErrors.description}
          hint={`${description.length}/${DESCRIPTION_MAX}`}
        >
          {(fieldProps) => (
            <textarea
              {...fieldProps}
              className="form-control"
              rows={6}
              style={{ resize: 'vertical' }}
              value={description}
              disabled={busy}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
        </Field>

        <AttachmentPicker attachments={attachments} onAdd={addAttachments} onRemove={removeAttachment} disabled={busy} />

        <div className="d-flex gap-2 justify-content-end mt-4">
          <Button variant="secondary" type="button" disabled={busy} onClick={() => navigate('/tickets')}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" busy={busy} busyLabel="Submitting…">
            Submit Ticket
          </Button>
        </div>
      </form>
    </div>
  )
}
