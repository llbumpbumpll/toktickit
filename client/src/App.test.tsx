import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import '@testing-library/jest-dom'

const STORED_REQUESTER = { id: 1, name: 'Aran Suksawat', email: 'aran.s@example.edu' }

describe('App shell', () => {
  afterEach(() => {
    sessionStorage.clear()
    window.history.pushState({}, '', '/')
    vi.unstubAllGlobals()
  })

  it('redirects the default route to My Tickets when a Requester is selected', () => {
    sessionStorage.setItem('tokTickIt:requester', JSON.stringify(STORED_REQUESTER))
    render(<App />)
    expect(screen.getByRole('heading', { name: 'My Tickets' })).toBeInTheDocument()
  })

  it('renders the TokTickIT brand and primary nav links once a Requester is selected', () => {
    sessionStorage.setItem('tokTickIt:requester', JSON.stringify(STORED_REQUESTER))
    render(<App />)
    expect(screen.getByRole('link', { name: 'TokTickIT' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My Tickets' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create Ticket' })).toBeInTheDocument()
  })

  it('redirects to Requester Selection when no Requester is selected (AC-02)', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Development Requester Selection' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Change Requester' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'My Tickets' })).not.toBeInTheDocument()
  })

  it('shows the Requester identity and Change Requester action once a Requester is stored', () => {
    sessionStorage.setItem('tokTickIt:requester', JSON.stringify(STORED_REQUESTER))
    render(<App />)
    expect(screen.getByText('Aran Suksawat')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change Requester' })).toBeInTheDocument()
  })

  it('renders the Requester Selection screen without the ticket nav', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }))
    window.history.pushState({}, '', '/select-requester')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Development Requester Selection' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'My Tickets' })).not.toBeInTheDocument()
  })
})
