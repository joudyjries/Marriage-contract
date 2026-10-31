import { useEffect, useRef, useState } from 'react'
import SaveTheDate from './SaveTheDate'
import Specialties from './Specialties'
import AboutCafe from './AboutCafe'
import OpeningDay from './OpeningDay'
import RSVP from './RSVP'
import Footer from './Footer'
import useScrollReveal from './useScrollReveal'
import useInvitationMusic from './useInvitationMusic'
import './index.css'

export default function App() {
  const [arabic, setArabic] = useState(false)
  const [opened, setOpened] = useState(false)
  const motionPaused = false
  const { audioRef, playing, startMusic, toggleMusic } = useInvitationMusic()
  const openingTitle = useRef<HTMLHeadingElement>(null)
  const continuation = useRef<HTMLElement>(null)
  const openingPage = useRef<HTMLDivElement>(null)
  useScrollReveal(openingPage, opened)

  useEffect(() => {
    const image = new Image()
    image.src = '/images/maison-opening.png'
  }, [])

  useEffect(() => {
    if (opened) openingTitle.current?.focus({ preventScroll: true })
  }, [opened])

  const languageButton = (
    <button className="language-button" onClick={() => setArabic(!arabic)} lang={arabic ? 'en' : 'ar'} aria-label={arabic ? 'Switch to English' : 'التبديل للعربية'}>
      {arabic ? 'EN' : 'عربي'}
    </button>
  )

  const musicButton = (
    <button className="motion-button" data-music-toggle onClick={toggleMusic} aria-pressed={playing} aria-label={arabic ? (playing ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى') : (playing ? 'Pause music' : 'Play music')}>
      <span /><span /><span />
    </button>
  )

  function openInvitation() {
    startMusic()
    setOpened(true)
  }

  return (
    <main className="welcome-shell">
      <audio ref={audioRef} src="/audio/fairuz.m4a" autoPlay loop preload="auto" hidden />
      {opened ? (
        <div className={`opening-page${motionPaused ? ' opening-page--paused' : ''}`} ref={openingPage}>
          <section className={`opening-scene${motionPaused ? ' opening-scene--paused' : ''}`} aria-label={arabic ? 'الافتتاح الكبير' : 'Grand opening'}>
            <img className="opening-scene__photo" src="/images/maison-opening.png" alt="" fetchPriority="high" />
            <div className="opening-scene__shade" />
            <div className="opening-logo" dir="ltr" aria-label="Maison Café">
              <svg viewBox="0 0 64 74" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden="true">
                <path d="M32 5C21 15 24 25 32 32C41 23 42 14 32 5ZM13 26C8 43 18 58 29 64C27 46 21 33 13 26ZM51 26C56 43 46 58 35 64C37 46 43 33 51 26Z" />
              </svg>
              <span>MAISON<span>CAFÉ</span></span>
            </div>
            <div className={`opening-copy${arabic ? ' opening-copy--arabic' : ''}`} dir={arabic ? 'rtl' : 'ltr'}>
              <p className="opening-copy__eyebrow">{arabic ? 'ندعوكم لحضور' : 'YOU’RE INVITED TO OUR'}</p>
              <h1 ref={openingTitle} tabIndex={-1}>
                <span className="opening-copy__grand">{arabic ? 'الافتتاح' : 'GRAND'}</span>
                <span className="opening-copy__script">{arabic ? 'الكبير' : 'Opening'}</span>
              </h1>
              <div className="brand__divider" aria-hidden="true"><span /></div>
              <p className="opening-copy__tagline">{arabic ? <>شيء جميل<br />يُحضّر هنا</> : <>SOMETHING BEAUTIFUL<br />IS BREWING</>}</p>
            </div>
            <button className="scroll-button" aria-label={arabic ? 'مرّر للأسفل' : 'Scroll down'} onClick={() => continuation.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v17m-6-6 6 6 6-6" /></svg>
            </button>
          </section>
          <section className="guest-section" ref={continuation} aria-labelledby="guest-heading" dir={arabic ? 'rtl' : 'ltr'}>
            <img className="guest-section__photo" src="/images/maison-guest.png" alt="" loading="lazy" />
            <article className={`guest-card${arabic ? ' guest-card--arabic' : ''}`}>
              <span className="guest-card__pin" aria-hidden="true" />
              <h2 id="guest-heading" data-scroll-reveal><span>{arabic ? 'كن ضيفنا' : 'Be Our'}</span><em>{arabic ? 'المميّز' : 'Special Guest'}</em></h2>
              <div className="brand__divider" aria-hidden="true"><span /></div>
              <h3 data-scroll-reveal>{arabic ? 'أنت مدعو' : 'You’re Invited'}</h3>
              <div className="guest-card__body">
                <p data-scroll-reveal>{arabic ? 'يسعدنا أن ندعوكم شخصياً للاحتفال بالافتتاح الكبير لميزون كافيه.' : 'We are delighted to personally invite you to celebrate the grand opening of Maison Café.'}</p>
                <p data-scroll-reveal>{arabic ? 'انضموا إلينا في يوم دافئ لا يُنسى، مع قهوة رائعة، وضيافة لذيذة، ولحظات مميّزة.' : 'Join us for a warm and memorable day filled with great coffee, delicious treats, and special moments.'}</p>
              </div>
              <p className="guest-card__closing" data-scroll-reveal>{arabic ? <>نتشوّق للاحتفال<br />معكم!</> : <>We can’t wait to<br />celebrate with you!</>}</p>
              <svg className="guest-card__heart" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20S3 14.5 3 8.5C3 3 10 2 12 7C14 2 21 3 21 8.5C21 14.5 12 20 12 20Z" /></svg>
            </article>
          </section>
          <SaveTheDate arabic={arabic} />
          <Specialties arabic={arabic} paused={motionPaused} />
          <AboutCafe arabic={arabic} />
          <OpeningDay arabic={arabic} paused={motionPaused} />
          <RSVP arabic={arabic} />
          <Footer arabic={arabic} />
          <div className="experience-controls">
            {languageButton}
            {musicButton}
          </div>
        </div>
      ) : (
      <section className="invitation" aria-label="Maison Café">
        <button className="invitation__entry" aria-label={arabic ? 'افتح الدعوة' : 'Open the invitation'} onClick={openInvitation} />
        <img className="invitation__photo" src="/images/maison-coffee.png" alt="" fetchPriority="high" />
        <div className="invitation__wash" />
        <header className="brand" dir="ltr">
          <svg className="coffee-mark" viewBox="0 0 64 74" fill="currentColor" aria-hidden="true">
            <path d="M32 3C19 13 21 26 31 34C41 25 45 13 32 3ZM14 21C7 37 15 53 29 64C28 43 23 30 14 21ZM4 34C2 51 13 62 26 68C17 51 10 41 4 34ZM49 21C57 37 48 53 35 64C36 43 41 30 49 21ZM60 34C62 51 51 62 38 68C47 51 54 41 60 34Z" />
          </svg>
          <h1>MAISON<span>CAFÉ</span></h1>
          <p className={arabic ? 'brand__story brand__story--arabic' : 'brand__story'} dir={arabic ? 'rtl' : 'ltr'}>
            {arabic ? <>حكاية جديدة<br />تبدأ من هنا</> : <>A NEW STORY<br />BEGINS HERE</>}
          </p>
          <div className="brand__divider" aria-hidden="true"><span /></div>
        </header>
        <div className="invitation__actions">
          <button className="open-button" onClick={openInvitation} dir="ltr">
            <span>{arabic ? 'اضغط للفتح' : 'TAP TO OPEN'}</span>
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
          </button>
          <div className="footer-flourish" aria-hidden="true">
            <svg viewBox="0 0 40 48" fill="none"><path d="M21 45C20 31 21 22 23 10C25-4 34 9 23 19C15 10 11 18 17 23C20 25 22 27 23 30C34 15 41 26 28 31C20 30 10 22 9 29C8 34 18 34 21 38" /></svg>
          </div>
        </div>
        {languageButton}
        <div className="invitation__music-control">{musicButton}</div>
      </section>
      )}
    </main>
  )
}
