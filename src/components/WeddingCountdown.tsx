import { useEffect, useState } from 'react'

// November 30, 2026 at the start of the day in the guest's local time.
const weddingDate = '2026-11-30T00:00:00'

export default function WeddingCountdown() {
  const [now, setNow] = useState(() => Date.now())
  const target = weddingDate ? Date.parse(weddingDate) : NaN

  useEffect(() => {
    if (!Number.isFinite(target)) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [target])

  const remaining = Math.max(0, Math.floor((target - now) / 1000))
  const units = [
    { label: 'DAYS', value: Math.floor(remaining / 86400) },
    { label: 'HOURS', value: Math.floor(remaining / 3600) % 24 },
    { label: 'MINUTES', value: Math.floor(remaining / 60) % 60 },
    { label: 'SECONDS', value: remaining % 60 },
  ]

  return (
    <div className="wedding-countdown" role="timer" aria-label="الوقت المتبقي حتى الزفاف" aria-live="off">
      {units.map(unit => <div className="wedding-countdown__unit" key={unit.label}>
        <span className="wedding-countdown__value">{Number.isFinite(target) ? String(unit.value).padStart(2, '0') : '—'}</span>
        <span className="wedding-countdown__label">{unit.label}</span>
      </div>)}
    </div>
  )
}
