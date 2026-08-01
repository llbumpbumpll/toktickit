import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriorityBadge, StatusBadge } from './Badge'
import '@testing-library/jest-dom'

describe('PriorityBadge', () => {
  it.each([
    ['LOW', 'text-bg-secondary'],
    ['MEDIUM', 'text-bg-success'],
    ['HIGH', 'text-bg-warning'],
    ['URGENT', 'text-bg-danger'],
  ] as const)('renders %s with its text label (never color alone)', (priority, expectedClass) => {
    render(<PriorityBadge priority={priority} />)
    const badge = screen.getByText(priority)
    expect(badge).toHaveClass(expectedClass)
  })
})

describe('StatusBadge', () => {
  it('renders NEW, the only status used in Lab 2', () => {
    render(<StatusBadge status="NEW" />)
    expect(screen.getByText('NEW')).toBeInTheDocument()
  })
})
