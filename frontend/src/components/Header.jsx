import { useEffect, useState } from 'react'

export default function Header({
  userName,
  profilePhotoUrl,
  theme,
  onToggleTheme,
  searchQuery,
  onSearchChange,
  onRefresh,
  onToggleMobileNav,
  mobileNavOpen,
}) {
  const [imgErr, setImgErr] = useState(false)
  useEffect(() => {
    setImgErr(false)
  }, [profilePhotoUrl])
  const showPhoto = profilePhotoUrl && !imgErr

  return (
    <header className="dash-header">
      <div className="dash-header-primary">
        <button
          type="button"
          className="mobile-nav-toggle"
          aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-controls="app-sidebar"
          aria-expanded={mobileNavOpen ? 'true' : 'false'}
          onClick={() => onToggleMobileNav?.()}
        >
          <span className="mobile-nav-toggle-bars" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>
        <div className="dash-greeting">
          <span className="dash-wave" aria-hidden>
            👋
          </span>
          <h1 className="dash-greeting-text">
            Welcome, <span className="dash-name">{userName || 'User'}</span>
          </h1>
        </div>
      </div>

      <div className="dash-header-tools">
        <label className="dash-search">
          <span className="visually-hidden">Search transactions</span>
          <input
            type="search"
            placeholder="Search title, medium, category…"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          className="dash-icon-btn"
          title="Refresh data"
          aria-label="Refresh data"
          onClick={() => onRefresh?.()}
        >
          ↻
        </button>
        <button type="button" className="dash-icon-btn" title="Notifications" aria-label="Notifications">
          🔔
        </button>
        <button
          type="button"
          className="dash-icon-btn"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '🌙'}
        </button>
        <div className="dash-avatar-wrap">
          {showPhoto ? (
            <img
              src={profilePhotoUrl}
              alt=""
              className="dash-avatar-img"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="dash-avatar" aria-hidden>
              {(userName || 'U').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
