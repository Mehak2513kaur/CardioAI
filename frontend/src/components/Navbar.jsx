import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <div className="logo-icon">
          <img src="/heart_logo.png" alt="CardioAI Logo" className="heart-animated" />
        </div>
        <span className="logo-text">Cardio<span>AI</span></span>
      </Link>

      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          Home
        </NavLink>
        <NavLink to="/predict" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          Detect
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          Dashboard
        </NavLink>
      </div>

      <Link to="/predict" className="nav-cta">
        Analyse Now
      </Link>
    </nav>
  )
}
