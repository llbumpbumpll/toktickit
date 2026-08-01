import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Field } from './Field'
import '@testing-library/jest-dom'

describe('Field', () => {
  it('renders the label and a required asterisk when required', () => {
    render(
      <Field label="Ticket Summary" required>
        {(props) => <input {...props} />}
      </Field>,
    )
    expect(screen.getByText('Ticket Summary')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('does not render an asterisk for optional fields', () => {
    render(
      <Field label="Attachments">
        {(props) => <input {...props} />}
      </Field>,
    )
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('shows the validation message without removing the asterisk', () => {
    render(
      <Field label="Ticket Summary" required error="Summary must be 5-150 characters.">
        {(props) => <input {...props} />}
      </Field>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Summary must be 5-150 characters.')
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('applies read-only styling and passes readOnly through to the control', () => {
    render(
      <Field label="Ticket Number" readOnly>
        {(props) => <input {...props} value="TCK-202608-0001" onChange={() => {}} />}
      </Field>,
    )
    const input = screen.getByDisplayValue('TCK-202608-0001')
    expect(input).toHaveAttribute('readonly')
  })
})
