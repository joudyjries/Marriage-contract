import { useEffect, useState } from 'react'
import { getCountdown, OPENING_TIME } from './eventTime'

export default function SaveTheDate({ arabic }: { arabic: boolean }) {
  const [countdown, setCountdown] = useState(() => getCountdown())

  useEffect(() => {
    const update = () => setCountdown(getCountdown())
    const interval = window.setInterval(update, 1000)
    document.addEventListener('visibilitychange', update)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', update)
    }
  }, [])

  const labels = arabic ? ['يوم', 'ساعة', 'دقيقة', 'ثانية'] : ['DAYS', 'HOURS', 'MIN', 'SEC']

  return (
    <section className="date-section" aria-labelledby="date-heading" dir={arabic ? 'rtl' : 'ltr'}>
      <img className="date-section__photo" src="/images/maison-date.png" alt="" loading="lazy" />
      <div className="date-section__content">
        <h2 id="date-heading" data-scroll-reveal>{arabic ? 'احفظوا الموعد' : 'SAVE THE DATE'}</h2>
        <div className="brand__divider" aria-hidden="true"><span /></div>

        <div className="date-card">
          <div className="date-card__row" data-scroll-reveal>
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="4" y="6" width="24" height="23" rx="3" /><path d="M10 3v7m12-7v7M4 13h24M10 18h2m4 0h2m4 0h1M10 23h2m4 0h2" /></svg>
            <time dateTime={OPENING_TIME}>{arabic ? <>الأحد<br />١٥ نوفمبر، ٢٠٢٦</> : <>SUNDAY<br />NOVEMBER 15, 2026</>}</time>
          </div>
          <div className="date-card__row" data-scroll-reveal>
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="16" cy="16" r="12" /><path d="M16 8v8l5 3" /></svg>
            <span dir="ltr">{arabic ? '٤:٠٠ عصراً – ٩:٠٠ مساءً' : '4:00 PM – 9:00 PM'}</span>
          </div>
          <div className="date-card__row" data-scroll-reveal>
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M25 13c0 7-9 16-9 16S7 20 7 13a9 9 0 1 1 18 0Z" /><circle cx="16" cy="13" r="3.5" /></svg>
            <div><span>{arabic ? 'ميزون كافيه' : 'MAISON CAFÉ'}</span><small>{arabic ? 'المزة، دمشق' : 'Mazzeh, Damascus'}</small></div>
          </div>
          <a className="directions-button" data-scroll-reveal href="https://www.google.com/maps/dir/?api=1&destination=Maison+Caf%C3%A9%2C+Mazzeh%2C+Damascus" target="_blank" rel="noopener noreferrer">
            <span>{arabic ? 'الاتجاهات' : 'GET DIRECTIONS'}</span>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
          </a>
        </div>

        <div className="countdown" data-scroll-reveal>
          <p>{arabic ? 'باقي على الافتتاح' : 'OPENING IN'}</p>
          <div className="countdown__units" role="timer" aria-label={arabic ? 'الوقت المتبقي للافتتاح' : 'Time until opening'} dir="ltr">
            {countdown.map((value, index) => (
              <div className="countdown__unit" key={labels[index]}>
                <span>{String(value).padStart(2, '0')}</span>
                <small lang={arabic ? 'ar' : 'en'}>{labels[index]}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
