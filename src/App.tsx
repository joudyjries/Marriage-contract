import { useEffect, useRef, useState } from 'react'
import MusicBox3D from './components/MusicBox3D'
import { useCallback } from 'react'
import EnvelopeWelcome from './components/EnvelopeWelcome'
import WeddingCountdown from './components/WeddingCountdown'
import WeddingRSVP from './components/WeddingRSVP'
import useInvitationAudio from './useInvitationAudio'
import './scene.css'

type Phase='box'|'leaving'|'entering'|'couple'|'returning'|'resetting'

export default function App() {
  const audio = useInvitationAudio()
  const [isOpen, setIsOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [settledOpen, setSettledOpen] = useState(false)
  const [assetError, setAssetError] = useState(false)
  const [enteredAt, setEnteredAt] = useState<number | null>(null)
  const finishWelcome = useCallback(() => setEnteredAt(performance.now()), [])
  const hasOpened = useRef(false)
  const invitationNote = useRef<HTMLElement>(null)
  const [phase,setPhase]=useState<Phase>('box')
  const isPedestal=phase==='entering'||phase==='couple'||phase==='returning'
  const isFading=phase==='leaving'||phase==='entering'||phase==='returning'||phase==='resetting'

  useEffect(() => {
    if (enteredAt === null || !ready || isOpen || busy || phase!=='box') return
    // Start one second after entry, while allowing graphics to finish preparing.
    // Replay waits for the case to close, then repeats the same one-second pause.
    const delay = hasOpened.current ? 1000 : Math.max(0, 1000 - (performance.now() - enteredAt))
    const timer = window.setTimeout(() => {
      hasOpened.current = true
      setBusy(true)
      setIsOpen(true)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [ready, isOpen, busy, enteredAt, phase])

  useEffect(() => {
    if(phase!=='box' || !isOpen || !settledOpen || busy) return
    const timer=window.setTimeout(()=>setPhase('leaving'),3000)
    return ()=>window.clearTimeout(timer)
  },[phase,isOpen,settledOpen,busy])

  useEffect(() => {
    if (phase !== 'couple') return
    let frame = 0
    const timer = window.setTimeout(() => {
      if (!invitationNote.current || window.scrollY > 8) return
      const start = window.scrollY
      const destination = Math.min(
        invitationNote.current.getBoundingClientRect().top + start - window.innerHeight * .18,
        document.documentElement.scrollHeight - window.innerHeight,
      )
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const began = performance.now()
      const scroll = (now: number) => {
        const progress = Math.min((now - began) / 2800, 1)
        const eased = progress * progress * (3 - 2 * progress)
        window.scrollTo(0, start + (destination - start) * eased)
        if (progress < 1) frame = requestAnimationFrame(scroll)
      }
      frame = requestAnimationFrame(scroll)
    }, 6500)
    // Let the guest take over as soon as they interact with the page.
    const cancel = () => { window.clearTimeout(timer); cancelAnimationFrame(frame) }
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
    events.forEach(event => window.addEventListener(event, cancel, { passive: true }))
    return () => {
      cancel()
      events.forEach(event => window.removeEventListener(event, cancel))
    }
  }, [phase])

  return (
    <main className="invitation" aria-label="دعوة زفاف ديفيد وآنا">
      {enteredAt === null && <EnvelopeWelcome onStart={audio.begin} onOpened={finishWelcome} />}
      {enteredAt !== null && <button className="audio-toggle" type="button" dir="rtl"
        disabled={audio.status === 'loading' || audio.status === 'ended'}
        aria-pressed={audio.status === 'playing'}
        onClick={() => audio.status === 'error' ? window.location.reload() : audio.toggle()}>
        {audio.status === 'loading' ? 'جارٍ تحميل الموسيقى…' : audio.status === 'playing' ? 'إيقاف الموسيقى مؤقتاً' : audio.status === 'error' ? 'تعذّر تحميل الصوت — إعادة المحاولة' : audio.status === 'ended' ? 'انتهت الموسيقى' : 'تشغيل الموسيقى ♫'}
      </button>}
      <div className="room-extension" aria-hidden="true" />
      <section className={`scene${isOpen ? ' scene--open' : ''}${isPedestal ? ' scene--pedestal' : ''}${isFading ? ' scene--hidden' : ''}`}
        inert={enteredAt === null} data-phase={phase} aria-label={isPedestal ? 'مشهد العروسين على قاعدة مزخرفة' : 'صندوق موسيقى الزفاف'}
        onTransitionEnd={event=>{
          if(event.target!==event.currentTarget || event.propertyName!=='opacity') return
          if(phase==='leaving') setPhase('entering')
          if(phase==='returning') {
            setBusy(true)
            setSettledOpen(false)
            setIsOpen(false)
            setPhase('resetting')
          }
        }}>
        <img className="scene__room" src="/images/blush-room.png"
          alt="قوس كلاسيكي وردي تلامسه أشعة الشمس وطاولة مغطاة بساتان وردي"
          fetchPriority="high" />
        <div className="scene__light" aria-hidden="true" />
        {(!isPedestal || phase==='couple') && <header key={isPedestal ? 'couple' : 'box'} className={`inscription${isPedestal ? ' inscription--couple' : ''}`} dir="ltr">
          <p className="inscription__eyebrow">{isPedestal ? <>WE’RE GETTING<br />MARRIED</> : 'THE WEDDING OF'}</p>
          <h1 id="couple-names">David <span>&amp;</span> Anna</h1>
          <div className="inscription__flourish" aria-hidden="true">
            <span />
            <svg viewBox="0 0 90 30" fill="none">
              <path d="M4 19c17 0 22-8 32-8 8 0 9 10 3 10-7 0-2-11 6-15 8 4 13 15 6 15-6 0-5-10 3-10 10 0 15 8 32 8M45 7V2m0 5-4-3m4 3 4-3M11 18c2-7 10-9 14-5m-8 4c3 7 10 7 14 3m48-2c-2-7-10-9-14-5m8 4c-3 7-10 7-14 3" />
              <path d="m45 23 2 2-2 2-2-2 2-2Z" />
            </svg>
            <span />
          </div>
        </header>}
        <div className="casket" data-state={isOpen ? 'open' : 'closed'}>
          <div className="casket__shadow" aria-hidden="true" />
          {!ready && <img className="casket__fallback" src="/images/closed-box-initial.png" alt="" fetchPriority="high" />}
          <MusicBox3D open={isOpen} presentation={isPedestal ? 'pedestal' : 'box'} onReady={() => setReady(true)}
            onError={() => { setAssetError(true); setReady(false) }}
            onPresentationReady={presentation=>{
              if(presentation==='pedestal' && phase==='entering') setPhase('couple')
              if(presentation==='box' && phase==='resetting') setPhase('box')
            }}
            onSettled={(opened) => { setBusy(false); setSettledOpen(opened) }} />
        </div>
        {assetError && <button className="asset-retry" onClick={() => window.location.reload()}>إعادة المحاولة</button>}
        {phase==='couple' && !busy && <button className="scroll-hint" onClick={() => invitationNote.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })} aria-label="الانتقال إلى نص الدعوة">
          <span>SCROLL</span>
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg>
        </button>}
        <p className="sr-only" role="status">{isPedestal ? 'عروسان بوضعية رقص ثابتة بوسط الطاولة فوق قاعدة وردية مزخرفة بالذهب' : isOpen ? 'فُتح صندوق الموسيقى، والعروسان يدوران بداخله' : ''}</p>
      </section>
      {phase==='couple' && <section ref={invitationNote} className="invitation-note" dir="ltr" aria-labelledby="invitation-heading">
        <h2 id="invitation-heading">With love, we invite you</h2>
        <div className="invitation-note__divider" aria-hidden="true">✦</div>
        <p className="invitation-note__message">
          to be a part of our special day<br />
          as we begin a new chapter together.<br />
          Your presence will make our celebration<br />
          truly meaningful.
        </p>
        <div className="inscription__flourish invitation-note__flourish" aria-hidden="true">
          <span />
          <svg viewBox="0 0 90 30" fill="none"><path d="M4 19c17 0 22-8 32-8 8 0 9 10 3 10-7 0-2-11 6-15 8 4 13 15 6 15-6 0-5-10 3-10 10 0 15 8 32 8M45 7V2m0 5-4-3m4 3 4-3M11 18c2-7 10-9 14-5m-8 4c3 7 10 7 14 3m48-2c-2-7-10-9-14-5m8 4c-3 7-10 7-14 3" /></svg>
          <span />
        </div>
        <p className="invitation-note__countdown">The countdown has begun</p>
        <div className="invitation-note__divider" aria-hidden="true">✦</div>
        <WeddingCountdown />
        <section className="wedding-schedule" aria-labelledby="schedule-heading">
          <h2 id="schedule-heading">The Schedule</h2>
          <div className="invitation-note__divider" aria-hidden="true">✦</div>
          <ol className="schedule-timeline">
            <li className="schedule-timeline__event">
              <svg className="schedule-timeline__icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <circle cx="18" cy="29" r="10" /><circle cx="18" cy="29" r="7.5" />
                <circle cx="31" cy="29" r="10" /><circle cx="31" cy="29" r="7.5" />
                <path d="m14 15 4-5 4 5-4 5-4-5Zm0 0h8m-6-3 2 8 2-8" />
              </svg>
              <div className="schedule-timeline__details">
                <h3>Wedding<br />Ceremony</h3>
                <p><time dateTime="16:00">4:00 PM</time></p>
              </div>
            </li>
            <li className="schedule-timeline__event">
              <svg className="schedule-timeline__icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                <circle cx="25" cy="25" r="12" /><circle cx="25" cy="25" r="9" />
                <path d="M7 7v11c0 3 5 3 5 0V7M9.5 7v33m-5-33v11c0 3 2 5 5 5M43 7c-5 4-6 10-6 16h6m0-16v33" />
              </svg>
              <div className="schedule-timeline__details">
                <h3>Reception</h3>
                <p><time dateTime="18:00">6:00 PM</time></p>
              </div>
            </li>
          </ol>
        </section>
        <section className="wedding-locations" aria-labelledby="locations-heading">
          <h2 id="locations-heading">Locations</h2>
          <div className="invitation-note__divider" aria-hidden="true">✦</div>
          <article className="venue" aria-labelledby="venue-name">
            <img className="venue__illustration" src="/images/venue-watercolor.png" alt="رسم مائي لفيلا متوسطية ومسبح تحيط به أشجار السرو" loading="lazy" width="1448" height="1086" />
            <p className="venue__eyebrow">RECEPTION</p>
            <h3 id="venue-name">Ca Na Xica</h3>
            <address className="venue__address">
              Carretera de Sant Miquel Km 10.2<br />
              Sant Miquel de Balansat, Ibiza, Spain
            </address>
            <a className="venue__map" href="https://www.google.com/maps/search/?api=1&query=Ca+Na+Xica+Carretera+de+Sant+Miquel+Km+10.2+Ibiza+Spain" target="_blank" rel="noopener noreferrer" aria-label="View Ca Na Xica location on Google Maps">
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 18s6-6.1 6-11a6 6 0 0 0-12 0c0 4.9 6 11 6 11Z" /><circle cx="10" cy="7" r="2" /></svg>
              <span>VIEW LOCATION</span>
            </a>
          </article>
        </section>
        <WeddingRSVP />
        <footer className="invitation-footer">
          <p>With love,</p>
          <p className="invitation-footer__names">David &amp; Anna</p>
          <button className="invitation-note__replay" onClick={() => { window.scrollTo(0, 0); setPhase('returning') }}>إعادة المشهد</button>
        </footer>
      </section>}
    </main>
  )
}


