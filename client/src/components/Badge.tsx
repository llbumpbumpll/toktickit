export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TicketStatus = 'NEW'

const PRIORITY_CLASS: Record<Priority, string> = {
  LOW: 'text-bg-secondary',
  MEDIUM: 'text-bg-success',
  HIGH: 'text-bg-warning',
  URGENT: 'text-bg-danger',
}

const STATUS_CLASS: Record<TicketStatus, string> = {
  NEW: 'text-bg-light border border-success-subtle text-success-emphasis',
}

/** Requested Priority badge per ui-spec.md §10 — text label always accompanies color. */
export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge ${PRIORITY_CLASS[priority]}`}>{priority}</span>
}

/** Current Status badge per ui-spec.md §10 — only NEW exists in Lab 2. */
export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`badge ${STATUS_CLASS[status]}`}>{status}</span>
}
