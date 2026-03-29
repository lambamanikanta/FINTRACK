import { useEffect, useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { assetUrl } from '../services/api.js'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

export default function MainLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    if (!mobileMenuOpen) return
    function onKey(e) {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [mobileMenuOpen])

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  function requestRefresh() {
    setRefreshKey((k) => k + 1)
  }

  const outletContext = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      refreshKey,
      requestRefresh,
    }),
    [searchQuery, refreshKey]
  )

  function closeMobileMenu() {
    setMobileMenuOpen(false)
  }

  return (
    <div className={`app-shell${mobileMenuOpen ? ' app-shell--nav-open' : ''}`}>
      <button type="button" className="sidebar-backdrop" aria-label="Close menu" onClick={closeMobileMenu} />
      <Sidebar
        userName={user?.name}
        profilePhotoUrl={assetUrl(user?.profilePicture, user?.updatedAt)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={closeMobileMenu}
        onLogout={() => {
          logout()
          navigate('/login')
        }}
      />
      <div className="app-main">
        <Header
          userName={user?.name}
          profilePhotoUrl={assetUrl(user?.profilePicture, user?.updatedAt)}
          theme={theme}
          onToggleTheme={toggleTheme}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={requestRefresh}
          onToggleMobileNav={() => setMobileMenuOpen((open) => !open)}
          mobileNavOpen={mobileMenuOpen}
        />
        <div className="app-content">
          <Outlet context={outletContext} />
        </div>
        <footer className="app-footer">
          <span>Fintrack</span>
          <span className="footer-sep" aria-hidden>
            ·
          </span>
          <span>Developed by Manikanta Lamba</span>
        </footer>
      </div>
    </div>
  )
}
