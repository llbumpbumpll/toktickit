import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearStoredRequester, getStoredRequester } from '../lib/requesterSession'

/**
 * Application shell per ui-spec.md §4: TokTickIT identity, My Tickets/Create
 * Ticket nav, current-Requester display + Change Requester action (both
 * hidden until a Requester is selected), active-page indication, and a
 * mobile nav that collapses below 768px (Bootstrap navbar-toggler).
 */
export function AppShell() {
  const navigate = useNavigate()
  const requester = getStoredRequester()

  const changeRequester = () => {
    clearStoredRequester()
    navigate('/select-requester')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active fw-semibold' : ''}`

  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar navbar-expand-md" data-bs-theme="dark" style={{ backgroundColor: 'var(--zg-primary)' }}>
        <div className="container-fluid">
          <NavLink to="/tickets" className="navbar-brand text-white fw-bold">
            TokTickIT
          </NavLink>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#zg-nav-collapse"
            aria-controls="zg-nav-collapse"
            aria-expanded="false"
            aria-label="Toggle navigation"
            title="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="zg-nav-collapse">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <NavLink to="/tickets" className={navLinkClass} end>
                  My Tickets
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/tickets/new" className={navLinkClass}>
                  Create Ticket
                </NavLink>
              </li>
            </ul>
            {requester && (
              <div className="d-flex align-items-center gap-3">
                <span className="text-white small">{requester.name}</span>
                <button type="button" className="btn btn-sm btn-outline-light" onClick={changeRequester}>
                  Change Requester
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="flex-grow-1" style={{ backgroundColor: 'var(--zg-bg)' }}>
        <Outlet />
      </main>
    </div>
  )
}
