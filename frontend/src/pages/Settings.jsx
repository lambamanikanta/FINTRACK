import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useCurrency } from '../context/CurrencyContext.jsx'
import { assetUrl, authApi } from '../services/api.js'

export default function Settings() {
  const { user, loadUser } = useAuth()
  const fileRef = useRef(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')

  const photoUrl = assetUrl(user?.profilePicture, user?.updatedAt)

  async function onPickPhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError('')
    setPhotoBusy(true)
    try {
      await authApi.uploadAvatar(file)
      await loadUser()
    } catch (err) {
      setPhotoError(err.message || 'Upload failed')
    } finally {
      setPhotoBusy(false)
    }
  }

  async function onRemovePhoto() {
    if (!user?.profilePicture) return
    if (!window.confirm('Remove your profile photo?')) return
    setPhotoError('')
    setPhotoBusy(true)
    try {
      await authApi.deleteAvatar()
      await loadUser()
    } catch (err) {
      setPhotoError(err.message || 'Could not remove photo')
    } finally {
      setPhotoBusy(false)
    }
  }

  const {
    displayCurrency,
    setDisplayCurrency,
    baseCurrency,
    setBaseCurrency,
    usdInrRate,
    setUsdInrRate,
  } = useCurrency()

  return (
    <div className="settings-page">
      <h1 className="page-title">Settings</h1>
      <p className="muted section-lead">
        Choose which currency you <strong>enter and store</strong> in the app, which one you <strong>see</strong> on screen,
        and the USD→INR rate used to convert between them.
      </p>

      <section className="settings-card panel profile-card">
        <h2 className="settings-card-title">Profile photo</h2>
        <p className="muted small">JPEG, PNG, WebP, or GIF. Max 2 MB. Shown in the header.</p>
        {photoError && <p className="form-error">{photoError}</p>}
        <div className="profile-photo-row">
          <div className="profile-preview">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="profile-preview-img" />
            ) : (
              <div className="profile-preview-placeholder">{(user?.name || 'U').slice(0, 1).toUpperCase()}</div>
            )}
          </div>
          <div className="profile-photo-actions">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="visually-hidden" onChange={onPickPhoto} />
            <button type="button" className="btn-primary" disabled={photoBusy} onClick={() => fileRef.current?.click()}>
              {photoBusy ? 'Working…' : 'Upload photo'}
            </button>
            <button type="button" className="btn-secondary" disabled={photoBusy || !user?.profilePicture} onClick={onRemovePhoto}>
              Remove photo
            </button>
          </div>
        </div>
      </section>

      <section className="settings-card panel">
        <h2 className="settings-card-title">Stored amounts (what you type)</h2>
        <p className="muted small">
          All numbers saved to the server are in this currency. Change only if you know your existing data matches; otherwise
          old rows can look wrong after switching.
        </p>
        <div className="currency-toggle" role="group" aria-label="Storage currency">
          <button
            type="button"
            className={`currency-btn ${baseCurrency === 'INR' ? 'active' : ''}`}
            onClick={() => setBaseCurrency('INR')}
          >
            Store in ₹ INR
          </button>
          <button
            type="button"
            className={`currency-btn ${baseCurrency === 'USD' ? 'active' : ''}`}
            onClick={() => setBaseCurrency('USD')}
          >
            Store in $ USD
          </button>
        </div>
      </section>

      <section className="settings-card panel">
        <h2 className="settings-card-title">On-screen display</h2>
        <p className="muted small">
          Fintrack converts stored amounts with the rate below when this differs from &quot;stored&quot; currency.
        </p>
        <div className="currency-toggle" role="group" aria-label="Display currency">
          <button
            type="button"
            className={`currency-btn ${displayCurrency === 'INR' ? 'active' : ''}`}
            onClick={() => setDisplayCurrency('INR')}
          >
            Show ₹ INR
          </button>
          <button
            type="button"
            className={`currency-btn ${displayCurrency === 'USD' ? 'active' : ''}`}
            onClick={() => setDisplayCurrency('USD')}
          >
            Show $ USD
          </button>
        </div>
      </section>

      <section className="settings-card panel">
        <h2 className="settings-card-title">Exchange rate</h2>
        <p className="muted small">
          <strong>1 USD = how many INR?</strong> Used only when stored and display currencies differ. Update anytime (e.g.
          from your bank or xe.com).
        </p>
        <label className="field rate-field">
          <span>INR per 1 USD</span>
          <input
            type="number"
            min="1"
            step="0.01"
            value={usdInrRate}
            onChange={(e) => setUsdInrRate(e.target.value)}
          />
        </label>
        {baseCurrency !== displayCurrency && (
          <p className="rate-preview muted small">
            {baseCurrency === 'INR' && displayCurrency === 'USD' && (
              <>
                Example: <strong>₹{usdInrRate.toLocaleString('en-IN')}</strong> stored → about{' '}
                <strong>$1.00</strong> on screen.
              </>
            )}
            {baseCurrency === 'USD' && displayCurrency === 'INR' && (
              <>
                Example: <strong>$1.00</strong> stored → about <strong>₹{usdInrRate.toLocaleString('en-IN')}</strong> on
                screen.
              </>
            )}
          </p>
        )}
      </section>
    </div>
  )
}
