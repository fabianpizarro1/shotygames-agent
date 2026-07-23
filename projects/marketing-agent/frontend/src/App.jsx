import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Chat from './pages/Chat'
import History from './pages/History'
import Knowledge from './pages/Knowledge'

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>Shotygames</h1>
        <span>Agente de Marketing</span>
      </div>
      <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="icon">⚡</span> Generar
      </NavLink>
      <NavLink to="/historial" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="icon">📋</span> Historial
      </NavLink>
      <NavLink to="/conocimiento" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="icon">📚</span> Conocimiento
      </NavLink>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Sidebar />
      <div className="main">
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/historial" element={<History />} />
          <Route path="/conocimiento" element={<Knowledge />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
