import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const LEGACY_DISPLAY_KEY = 'fintrack_currency'
const STORAGE_DISPLAY = 'fintrack_display_currency'
const STORAGE_BASE = 'fintrack_base_currency'
const STORAGE_RATE = 'fintrack_usd_inr'

const DEFAULT_RATE = 83

function readDisplayCurrency() {
  const v = localStorage.getItem(STORAGE_DISPLAY) || localStorage.getItem(LEGACY_DISPLAY_KEY)
  return v === 'USD' || v === 'INR' ? v : 'INR'
}

function readBaseCurrency() {
  const v = localStorage.getItem(STORAGE_BASE)
  return v === 'USD' || v === 'INR' ? v : 'INR'
}

function readRate() {
  const raw = localStorage.getItem(STORAGE_RATE)
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_RATE
}

/** `amount` is stored in `base`. Returns equivalent in `display`. `rate` = INR per 1 USD. */
export function convertAmount(amount, base, display, rateInrPerUsd) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return 0
  const rate = Number(rateInrPerUsd)
  const r = Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_RATE
  if (base === display) return n
  if (base === 'INR' && display === 'USD') return n / r
  if (base === 'USD' && display === 'INR') return n * r
  return n
}

const CurrencyContext = createContext(null)

export function CurrencyProvider({ children }) {
  const [displayCurrency, setDisplayCurrencyState] = useState(readDisplayCurrency)
  const [baseCurrency, setBaseCurrencyState] = useState(readBaseCurrency)
  const [usdInrRate, setUsdInrRateState] = useState(readRate)

  useEffect(() => {
    localStorage.setItem(STORAGE_DISPLAY, displayCurrency)
    localStorage.setItem(LEGACY_DISPLAY_KEY, displayCurrency)
  }, [displayCurrency])

  useEffect(() => {
    localStorage.setItem(STORAGE_BASE, baseCurrency)
  }, [baseCurrency])

  useEffect(() => {
    localStorage.setItem(STORAGE_RATE, String(usdInrRate))
  }, [usdInrRate])

  const setDisplayCurrency = useCallback((c) => {
    if (c === 'USD' || c === 'INR') setDisplayCurrencyState(c)
  }, [])

  const setBaseCurrency = useCallback((c) => {
    if (c === 'USD' || c === 'INR') setBaseCurrencyState(c)
  }, [])

  const setUsdInrRate = useCallback((v) => {
    const n = typeof v === 'string' ? parseFloat(v) : Number(v)
    if (Number.isFinite(n) && n > 0) setUsdInrRateState(n)
  }, [])

  const toDisplayAmount = useCallback(
    (storedAmount) => convertAmount(storedAmount, baseCurrency, displayCurrency, usdInrRate),
    [baseCurrency, displayCurrency, usdInrRate]
  )

  /** Value is already in display currency (e.g. chart series after conversion). */
  const formatDisplay = useCallback(
    (displayValue, options = {}) => {
      const v = Number(displayValue)
      const n = Number.isFinite(v) ? v : 0
      const code = displayCurrency === 'INR' ? 'INR' : 'USD'
      const locale = displayCurrency === 'INR' ? 'en-IN' : 'en-US'
      if (options.compact && Math.abs(n) >= 1000) {
        return new Intl.NumberFormat(locale, {
          notation: 'compact',
          compactDisplay: 'short',
          style: 'currency',
          currency: code,
          maximumFractionDigits: 1,
        }).format(n)
      }
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code,
        maximumFractionDigits: options.fraction ?? 0,
        minimumFractionDigits: options.minFraction ?? 0,
      }).format(n)
    },
    [displayCurrency]
  )

  /** `storedValue` is in `baseCurrency`; converts to display then formats. */
  const format = useCallback(
    (storedValue, options = {}) => formatDisplay(toDisplayAmount(storedValue), options),
    [formatDisplay, toDisplayAmount]
  )

  const value = useMemo(
    () => ({
      /** What the UI shows (₹ or $ after conversion when needed). */
      currency: displayCurrency,
      displayCurrency,
      setDisplayCurrency,
      /** Numbers you type / API stores are in this currency. */
      baseCurrency,
      setBaseCurrency,
      /** How many INR equal 1 USD — used when base and display differ. */
      usdInrRate,
      setUsdInrRate,
      format,
      formatDisplay,
      toDisplayAmount,
      /** @deprecated use displayCurrency */
      setCurrency: setDisplayCurrency,
    }),
    [
      displayCurrency,
      setDisplayCurrency,
      baseCurrency,
      setBaseCurrency,
      usdInrRate,
      setUsdInrRate,
      format,
      formatDisplay,
      toDisplayAmount,
    ]
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}
