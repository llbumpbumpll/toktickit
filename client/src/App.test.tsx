import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import '@testing-library/jest-dom'

describe('App shell', () => {
  afterEach(() => {
    sessionStorage.clear()
    window.history.pushState({}, '', '/')
  })

  it('redirects the default route to My Tickets', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'My Tickets' })).toBeInTheDocument()
  })

  it('renders the TokTickIT brand and primary nav links', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: 'TokTickIT' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My Tickets' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create Ticket' })).toBeInTheDocument()
  })

  it('hides the Requester identity and Change Requester action when no Requester is selected', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Change Requester' })).not.toBeInTheDocument()
  })

  it('shows the Requester identity and Change Requester action once a Requester is stored', () => {
    sessionStorage.setItem('tokTickIt:requester', JSON.stringify({ id: 1, name: 'Aran Suksawat', email: 'aran.s@example.edu' }))
    render(<App />)
    expect(screen.getByText('Aran Suksawat')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Change Requester' })).toBeInTheDocument()
  })

  it('renders the Requester Selection screen without the ticket nav', () => {
    window.history.pushState({}, '', '/select-requester')
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Development Requester Selection' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'My Tickets' })).not.toBeInTheDocument()
  })
})
