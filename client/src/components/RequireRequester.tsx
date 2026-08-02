import { Navigate, Outlet } from 'react-router-dom'
import { getStoredRequester } from '../lib/requesterSession'

/**
 * Route guard for AC-02: without a stored Requester, every Requester-scoped
 * screen (My Tickets, Create Ticket, Ticket Detail) redirects to
 * /select-requester instead of rendering.
 */
export function RequireRequester() {
  const requester = getStoredRequester()
  if (!requester) {
    return <Navigate to="/select-requester" replace />
  }
  return <Outlet />
}
