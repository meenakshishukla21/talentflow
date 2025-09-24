import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/jobs', label: 'Jobs' },
  { to: '/candidates', label: 'Candidates' },
  { to: '/assessments', label: 'Assessments' }
]

function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">Talentflow</div>
        <nav className="nav-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
