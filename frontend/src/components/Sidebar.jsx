import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { to: '/transactions', label: 'Transactions', icon: '≡' },
  { to: '/loans', label: 'Loans', icon: '$' },
  { to: '/analytics', label: 'Analytics', icon: '◧' },
  { to: '/history', label: 'History', icon: '↻' },
]

const general = [
  { to: '/settings', label: 'Setting', icon: '⚙' },
  { to: '/help', label: 'Help Center', icon: '?' },
]

export default function Sidebar({ userName, profilePhotoUrl, onLogout, mobileOpen, onCloseMobile }) {
  const [imgErr, setImgErr] = useState(false)
  useEffect(() => {
    setImgErr(false)
  }, [profilePhotoUrl])
  const showPhoto = profilePhotoUrl && !imgErr

  function closeIfMobile() {
    onCloseMobile?.()
  }

  return (
    <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`} id="app-sidebar">
      <div className="sidebar-brand">
        {showPhoto ? (
          <img
            src={profilePhotoUrl}
            alt=""
            className="sidebar-brand-photo"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="sidebar-logo" aria-hidden title={userName || 'Fintrack'} />
        )}
        <span className="sidebar-title">Fintrack</span>
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        <p className="sidebar-section-label">Menu</p>
        <ul>
          {nav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={closeIfMobile}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <nav className="sidebar-nav sidebar-nav-secondary" aria-label="General">
        <p className="sidebar-section-label">General</p>
        <ul>
          {general.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={closeIfMobile}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-logout"
          onClick={() => {
            closeIfMobile()
            onLogout()
          }}
        >
          Log out
        </button>
      </div>
    </aside>
  )
}
