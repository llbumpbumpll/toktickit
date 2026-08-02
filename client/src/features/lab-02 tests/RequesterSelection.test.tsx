import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import App from '../../App'
import { getStoredRequester } from '../../lib/requesterSession'
import '@testing-library/jest-dom'

const REQUESTERS = [
  { id: 1, name: 'Aran Suksawat', email: 'aran.s@example.edu' },
  { id: 2, name: 'Bhumi Chaiyasit', email: 'bhumi.c@example.edu' },
]

function mockFetchOnce(response: { ok: boolean; json?: () => unknown }) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: response.ok,
      json: response.json ?? (async () => []),
    }),
  )
}

describe('Requester Selection screen', () => {
  afterEach(() => {
    sessionStorage.clear()
    window.history.pushState({}, '', '/')
    vi.unstubAllGlobals()
  })

  it('redirects a Requester-scoped route to Requester Selection when no Requester is stored (AC-02)', () => {
    mockFetchOnce({ ok: true, json: async () => REQUESTERS })
    window.history.pushState({}, '', '/tickets')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Development Requester Selection' })).toBeInTheDocument()
  })

  it('renders the dropdown of active Requesters on load success (AC-04)', async () => {
    mockFetchOnce({ ok: true, json: async () => REQUESTERS })
    window.history.pushState({}, '', '/select-requester')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Aran Suksawat (aran.s@example.edu)')).toBeInTheDocument()
    })
    expect(screen.getByText('Bhumi Chaiyasit (bhumi.c@example.edu)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  it('shows the empty state and disables Continue when no active Requesters exist (AC-05, BR-25)', async () => {
    mockFetchOnce({ ok: true, json: async () => [] })
    window.history.pushState({}, '', '/select-requester')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/No active Development Requesters are available/)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
  })

  it('shows a safe failure state when the Requesters API call fails (AC-06)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    window.history.pushState({}, '', '/select-requester')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load Requesters.')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('stores the selected Requester and navigates to My Tickets on Continue (FR-01)', async () => {
    mockFetchOnce({ ok: true, json: async () => REQUESTERS })
    window.history.pushState({}, '', '/select-requester')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Development Requester' })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByRole('combobox', { name: 'Development Requester' }), { target: { value: '1' } })
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(getStoredRequester()).toEqual(REQUESTERS[0])
    expect(screen.getByRole('heading', { name: 'My Tickets' })).toBeInTheDocument()
  })

  it('returns to Requester Selection via Change Requester (AC-07, BR-26)', async () => {
    sessionStorage.setItem('tokTickIt:requester', JSON.stringify(REQUESTERS[0]))
    mockFetchOnce({ ok: true, json: async () => REQUESTERS })
    window.history.pushState({}, '', '/tickets')
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Change Requester' }))

    expect(screen.getByRole('heading', { name: 'Development Requester Selection' })).toBeInTheDocument()
    expect(getStoredRequester()).toBeNull()
  })
})
