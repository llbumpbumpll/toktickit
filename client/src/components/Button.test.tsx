import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'
import '@testing-library/jest-dom'

describe('Button', () => {
  it('renders visible text for the primary variant', () => {
    render(<Button>Submit Ticket</Button>)
    expect(screen.getByRole('button', { name: 'Submit Ticket' })).toBeInTheDocument()
  })

  it('shows a busy state and disables the control while busy', () => {
    render(
      <Button busy busyLabel="Submitting…">
        Submit Ticket
      </Button>,
    )
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveTextContent('Submitting…')
  })

  it('applies the destructive variant class', () => {
    render(<Button variant="destructive">Remove</Button>)
    expect(screen.getByRole('button', { name: 'Remove' })).toHaveClass('btn-outline-danger')
  })
})
