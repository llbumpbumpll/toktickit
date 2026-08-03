import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import App from '../../App'
import '@testing-library/jest-dom'

const REQUESTER = { id: 1, name: 'Aran Suksawat', email: 'aran.s@example.edu' }
const CATEGORIES = [
  { id: 1, name: 'Hardware' },
  { id: 2, name: 'Software' },
]
const RELATED_SYSTEMS = [
  { id: 5, name: 'Corporate Laptop' },
  { id: 6, name: 'Email' },
]

type FetchHandlers = {
  createTicket?: (body: unknown) => { status: number; json: () => unknown }
  categoriesFail?: boolean
  relatedSystemsFail?: boolean
  createTicketNetworkError?: boolean
}

function mockFetch(handlers: FetchHandlers = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) => {
      if (url.endsWith('/categories')) {
        if (handlers.categoriesFail) return Promise.reject(new Error('network error'))
        return Promise.resolve({ ok: true, json: async () => CATEGORIES })
      }
      if (url.endsWith('/related-systems')) {
        if (handlers.relatedSystemsFail) return Promise.reject(new Error('network error'))
        return Promise.resolve({ ok: true, json: async () => RELATED_SYSTEMS })
      }
      if (url.endsWith('/tickets') && options?.method === 'POST') {
        if (handlers.createTicketNetworkError) return Promise.reject(new Error('network error'))
        if (handlers.createTicket) {
          const { status, json } = handlers.createTicket(JSON.parse(String(options.body)))
          return Promise.resolve({ ok: status < 300, status, json: async () => json() })
        }
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({ id: 42, ticketNumber: 'TCK-202608-0007', currentStatus: 'NEW' }),
        })
      }
      return Promise.reject(new Error(`Unhandled fetch: ${url}`))
    }),
  )
}

function setup() {
  sessionStorage.setItem('tokTickIt:requester', JSON.stringify(REQUESTER))
  window.history.pushState({}, '', '/tickets/new')
  render(<App />)
}

async function fillValidForm() {
  await waitFor(() => {
    expect(screen.getByRole('combobox', { name: /Category/ })).toBeInTheDocument()
  })
  fireEvent.change(screen.getByRole('combobox', { name: /Category/ }), { target: { value: '1' } })
  fireEvent.change(screen.getByRole('combobox', { name: /Related System/ }), { target: { value: '5' } })
  fireEvent.change(screen.getByRole('combobox', { name: /Requested Priority/ }), { target: { value: 'MEDIUM' } })
  fireEvent.change(screen.getByLabelText(/Ticket Summary/), { target: { value: 'Laptop battery drains quickly' } })
  fireEvent.change(screen.getByLabelText(/Description/), {
    target: { value: 'Battery drops from 100% to 20% within two hours of normal use.' },
  })
}

describe('Create Ticket screen', () => {
  afterEach(() => {
    sessionStorage.clear()
    window.history.pushState({}, '', '/')
    vi.unstubAllGlobals()
  })

  it('shows a full-screen failure state when reference data fails to load (AC-45)', async () => {
    mockFetch({ categoriesFail: true })
    setup()

    await waitFor(() => {
      expect(screen.getByText('Unable to load Category and Related System options.')).toBeInTheDocument()
    })
    expect(screen.queryByRole('combobox', { name: /Category/ })).not.toBeInTheDocument()
  })

  it('shows field-level errors and preserves entered values on missing required fields, without calling the API (AC-08, BR-19)', async () => {
    mockFetch()
    setup()

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /Category/ })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Ticket Summary/), { target: { value: 'Some summary text' } })
    const fetchSpy = vi.mocked(fetch)
    fetchSpy.mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Submit Ticket' }))

    expect(await screen.findByText('Category is required.')).toBeInTheDocument()
    expect(screen.getByText('Related System is required.')).toBeInTheDocument()
    expect(screen.getByText('Requested Priority is required.')).toBeInTheDocument()
    expect(screen.getByText('Description is required.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Some summary text')).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalledWith(expect.stringContaining('/tickets'), expect.anything())
  })

  it('shows a length error when Summary is shorter than 5 characters (AC-09)', async () => {
    mockFetch()
    setup()
    await fillValidForm()
    fireEvent.change(screen.getByLabelText(/Ticket Summary/), { target: { value: 'Hi' } })

    fireEvent.click(screen.getByRole('button', { name: 'Submit Ticket' }))

    expect(await screen.findByText('Ticket Summary must be 5-150 characters.')).toBeInTheDocument()
  })

  it('requires an explicit Requested Priority choice (AC-10, BR-11)', async () => {
    mockFetch()
    setup()
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /Requested Priority/ })).toBeInTheDocument()
    })
    expect(screen.getByRole('combobox', { name: /Requested Priority/ })).toHaveValue('')

    fireEvent.click(screen.getByRole('button', { name: 'Submit Ticket' }))

    expect(await screen.findByText('Requested Priority is required.')).toBeInTheDocument()
  })

  it('creates a ticket and displays the Ticket Number on success (AC-01)', async () => {
    mockFetch()
    setup()
    await fillValidForm()

    fireEvent.click(screen.getByRole('button', { name: 'Submit Ticket' }))

    expect(await screen.findByText('TCK-202608-0007')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View Ticket' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Another' })).toBeInTheDocument()
  })

  it('disables Submit during an in-flight request and sends only one request (AC-11, BR-18)', async () => {
    let resolveFetch: (value: unknown) => void = () => {}
    mockFetch({
      createTicket: () => {
        throw new Error('replaced below')
      },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, options?: RequestInit) => {
        if (url.endsWith('/categories')) return Promise.resolve({ ok: true, json: async () => CATEGORIES })
        if (url.endsWith('/related-systems')) return Promise.resolve({ ok: true, json: async () => RELATED_SYSTEMS })
        if (url.endsWith('/tickets') && options?.method === 'POST') {
          return new Promise((resolve) => {
            resolveFetch = resolve
          })
        }
        return Promise.reject(new Error(`Unhandled fetch: ${url}`))
      }),
    )
    setup()
    await fillValidForm()

    const submitButton = screen.getByRole('button', { name: 'Submit Ticket' })
    fireEvent.click(submitButton)

    await waitFor(() => expect(submitButton).toBeDisabled())
    fireEvent.click(submitButton)

    expect(vi.mocked(fetch).mock.calls.filter((c) => String(c[0]).endsWith('/tickets') && c[1]?.method === 'POST')).toHaveLength(1)

    resolveFetch({ ok: true, status: 201, json: async () => ({ id: 42, ticketNumber: 'TCK-202608-0007' }) })
    await screen.findByText('TCK-202608-0007')
  })

  it('shows a safe error and preserves form values when the backend is unreachable (AC-12, BR-20)', async () => {
    mockFetch({ createTicketNetworkError: true })
    setup()
    await fillValidForm()

    fireEvent.click(screen.getByRole('button', { name: 'Submit Ticket' }))

    expect(await screen.findByText(/Unable to reach the server/)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Laptop battery drains quickly')).toBeInTheDocument()
    expect(screen.queryByText('TCK-')).not.toBeInTheDocument()
  })

  it('rejects a disallowed file type client-side without uploading (AC-13)', async () => {
    mockFetch()
    setup()
    await waitFor(() => {
      expect(screen.getByLabelText('Attachments')).toBeInTheDocument()
    })

    const input = screen.getByLabelText('Attachments') as HTMLInputElement
    const file = new File(['x'], 'malware.exe', { type: 'application/octet-stream' })
    fireEvent.change(input, { target: { files: [file] } })

    expect(await screen.findByText(/Unsupported file type/)).toBeInTheDocument()
  })

  it('rejects a file larger than 5 MB client-side (AC-14)', async () => {
    mockFetch()
    setup()
    await waitFor(() => {
      expect(screen.getByLabelText('Attachments')).toBeInTheDocument()
    })

    const input = screen.getByLabelText('Attachments') as HTMLInputElement
    const bigFile = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [bigFile] } })

    expect(await screen.findByText(/exceeds the 5 MB size limit/)).toBeInTheDocument()
  })

  it('proactively disables the file picker once 5 attachments are accepted (AC-15, AC-41)', async () => {
    mockFetch()
    setup()
    await waitFor(() => {
      expect(screen.getByLabelText('Attachments')).toBeInTheDocument()
    })

    const input = screen.getByLabelText('Attachments') as HTMLInputElement
    const files = Array.from({ length: 5 }, (_, i) => new File(['x'], `file-${i}.png`, { type: 'image/png' }))
    fireEvent.change(input, { target: { files } })

    await waitFor(() => {
      expect(screen.getByText('Maximum 5 attachments reached.')).toBeInTheDocument()
    })
    expect(input).toBeDisabled()
  })
})
