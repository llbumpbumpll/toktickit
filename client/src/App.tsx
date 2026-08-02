import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequesterSelectionPage } from './pages/RequesterSelectionPage'
import { MyTicketsPage } from './pages/MyTicketsPage'
import { CreateTicketPage } from './pages/CreateTicketPage'
import { TicketDetailPage } from './pages/TicketDetailPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/select-requester" element={<RequesterSelectionPage />} />
        <Route element={<AppShell />}>
          <Route path="/tickets" element={<MyTicketsPage />} />
          <Route path="/tickets/new" element={<CreateTicketPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/tickets" replace />} />
        <Route path="*" element={<Navigate to="/tickets" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
