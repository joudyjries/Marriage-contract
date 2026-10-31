import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'

const specialties = [
  { image: 'coffee', title: 'SIGNATURE COFFEE', arabicTitle: 'قهوتنا المميّزة', description: 'Rich flavors, unforgettable moments.', arabicDescription: 'نكهات غنية ولحظات لا تُنسى.' },
  { image: 'pastries', title: 'FRESH PASTRIES', arabicTitle: 'مخبوزات طازجة', description: 'Baked daily with love.', arabicDescription: 'نخبزها كل يوم بكل حب.' },
  { image: 'cake', title: 'SWEET TREATS', arabicTitle: 'حلوياتنا', description: 'A little sweetness goes a long way.', arabicDescription: 'قليل من الحلاوة يصنع الكثير.' },
  { image: 'drinks', title: 'SPECIAL DRINKS', arabicTitle: 'مشروبات مميّزة', description: 'For every coffee lover.', arabicDescription: 'لكل عشّاق القهوة.' },
  { image: 'hookah', title: 'SIGNATURE HOOKAH', arabicTitle: 'أركيلتنا المميّزة', description: 'Special flavors, crafted for you.', arabicDescription: 'نكهات مميّزة، اخترناها لكم.' },
  { image: null, title: 'COMING SOON', arabicTitle: 'قريباً', description: '', arabicDescription: '' },
]
const slides = [specialties.at(-1)!, ...specialties, specialties[0]]
const count = specialties.length

export default function Specialties({ arabic, paused }: { arabic: boolean; paused: boolean }) {
  const [position, setPosition] = useState(1)
  const [transition, setTransition] = useState(true)
  const [dragOffset, setDragOffset] = useState(0)
  const [interacting, setInteracting] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const [manualEpoch, setManualEpoch] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const section = useRef<HTMLElement>(null)
  const current = useRef(1)
  const moving = useRef(false)
  const settleTimer = useRef<number | undefined>(undefined)
  const resetFrame = useRef<number | undefined>(undefined)
  const pointer = useRef<{ id: number; x: number; y: number; offset: number; horizontal: boolean } | null>(null)
  const active = (position - 1 + count) % count

  const finishMove = useCallback(() => {
    window.clearTimeout(settleTimer.current)
    const next = current.current === 0 ? count : current.current === count + 1 ? 1 : current.current
    if (next !== current.current) {
      setTransition(false)
      current.current = next
      setPosition(next)
      resetFrame.current = requestAnimationFrame(() => {
        resetFrame.current = requestAnimationFrame(() => {
          setTransition(true)
          moving.current = false
        })
      })
    } else {
      moving.current = false
    }
  }, [])

  const moveTo = useCallback((next: number) => {
    if (moving.current || next === current.current) return
    moving.current = true
    current.current = next
    setPosition(next)
    settleTimer.current = window.setTimeout(finishMove, reducedMotion ? 0 : 700)
  }, [finishMove, reducedMotion])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!section.current) return
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting && !document.hidden)
    }, { threshold: 0.3 })
    observer.observe(section.current)
    const onVisibility = () => {
      if (document.hidden) setVisible(false)
      else if (section.current) {
        const bounds = section.current.getBoundingClientRect()
        setVisible(bounds.bottom > innerHeight * .3 && bounds.top < innerHeight * .7)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    if (paused || reducedMotion || !visible || interacting || hovered || focused) return
    const interval = window.setInterval(() => moveTo(current.current + 1), 4500)
    return () => window.clearInterval(interval)
  }, [paused, reducedMotion, visible, interacting, hovered, focused, manualEpoch, moveTo])

  useEffect(() => () => {
    window.clearTimeout(settleTimer.current)
    if (resetFrame.current !== undefined) cancelAnimationFrame(resetFrame.current)
  }, [])

  function manualMove(next: number) {
    setManualEpoch(value => value + 1)
    moveTo(next)
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (moving.current || (event.pointerType === 'mouse' && event.button !== 0)) return
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, offset: 0, horizontal: false }
    setInteracting(true)
  }

  function drag(event: PointerEvent<HTMLDivElement>) {
    const gesture = pointer.current
    if (!gesture || gesture.id !== event.pointerId) return
    const distance = event.clientX - gesture.x
    if (!gesture.horizontal) {
      if (Math.abs(distance) < 8 || Math.abs(distance) <= Math.abs(event.clientY - gesture.y)) return
      gesture.horizontal = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    gesture.offset = Math.max(-180, Math.min(180, distance))
    setDragOffset(gesture.offset)
  }

  function endDrag(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const gesture = pointer.current
    if (!gesture || gesture.id !== event.pointerId) return
    pointer.current = null
    setInteracting(false)
    setDragOffset(0)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setManualEpoch(value => value + 1)
    if (!cancelled && Math.abs(gesture.offset) > 40) moveTo(current.current + (gesture.offset < 0 ? 1 : -1))
  }

  return (
    <section className="specialties-section" ref={section} aria-labelledby="specialties-heading" aria-roledescription="carousel" dir={arabic ? 'rtl' : 'ltr'}>
      <div className="specialties-section__decoration" aria-hidden="true" />
      <header className="specialties-heading">
        <h2 id="specialties-heading" data-scroll-reveal><em>{arabic ? 'اكتشفوا' : 'Our'}</em><span>{arabic ? 'أصنافنا المميّزة' : 'SPECIALTIES'}</span></h2>
        <div className="brand__divider" aria-hidden="true"><span /></div>
        <p data-scroll-reveal>{arabic ? 'قائمة نحضّرها بشغف، من أجود المكوّنات.' : 'Discover a menu crafted with passion and the finest ingredients.'}</p>
      </header>

      <div className="specialties-carousel" dir="ltr" onPointerEnter={event => { if (event.pointerType === 'mouse') setHovered(true) }} onPointerLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }} onKeyDown={event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          event.preventDefault()
          manualMove(current.current + (event.key === 'ArrowRight' ? 1 : -1))
        }
      }}>
        <div className={`specialties-window${interacting ? ' specialties-window--dragging' : ''}`} onPointerDown={startDrag} onPointerMove={drag} onPointerUp={event => endDrag(event)} onPointerCancel={event => endDrag(event, true)} onLostPointerCapture={event => { if (event.target === event.currentTarget) endDrag(event, true) }}>
          <div className={`specialties-track${!transition || interacting ? ' specialties-track--instant' : ''}`} style={{ transform: `translateX(calc(50% - var(--specialty-card-width) / 2 - ${position} * (var(--specialty-card-width) + var(--specialty-gap)) + ${dragOffset}px))` }} onTransitionEnd={event => { if (event.target === event.currentTarget && event.propertyName === 'transform') finishMove() }}>
            {slides.map((slide, index) => (
              <article className={`specialty-card${slide.image ? '' : ' specialty-card--soon'}`} key={`${slide.image}-${index}`} role="group" aria-roledescription="slide" aria-label={`${(index - 1 + count) % count + 1} / ${count}`} aria-hidden={index !== position} dir={arabic ? 'rtl' : 'ltr'}>
                {slide.image ? <>
                  <img src={`/images/specialty-${slide.image}.webp`} alt={arabic ? slide.arabicTitle : slide.title} loading={visible ? 'eager' : 'lazy'} draggable="false" />
                  <div className="specialty-card__caption"><h3>{arabic ? slide.arabicTitle : slide.title}</h3><p>{arabic ? slide.arabicDescription : slide.description}</p></div>
                </> : <div className="specialty-card__soon-content">
                  <svg className="specialty-card__mark" viewBox="0 0 64 74" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true"><path d="M32 5C21 15 24 25 32 32C41 23 42 14 32 5ZM13 26C8 43 18 58 29 64C27 46 21 33 13 26ZM51 26C56 43 46 58 35 64C37 46 43 33 51 26Z" /></svg>
                  <p className="specialty-card__eyebrow">{arabic ? slide.arabicTitle : slide.title}</p>
                  <h3>{arabic ? 'ترقّبونا' : 'Stay Tuned'}</h3>
                  <div className="brand__divider" aria-hidden="true"><span /></div>
                  <p className="specialty-card__soon-description">{arabic ? 'نكشف عن قائمتنا الجديدة يوم الافتتاح — نكهات جديدة، وأصناف ستعشقونها.' : 'Our upgraded menu will be unveiled at the grand opening — new flavors, new favorites.'}</p>
                </div>}
              </article>
            ))}
          </div>
        </div>
        <button className="specialties-arrow specialties-arrow--previous" aria-label={arabic ? 'الصنف السابق' : 'Previous specialty'} onClick={() => manualMove(current.current - 1)}><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m12 5-5 5 5 5" /></svg></button>
        <button className="specialties-arrow specialties-arrow--next" aria-label={arabic ? 'الصنف التالي' : 'Next specialty'} onClick={() => manualMove(current.current + 1)}><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m8 5 5 5-5 5" /></svg></button>
        <div className="specialties-dots" aria-label={arabic ? 'اختيار الصنف' : 'Choose a specialty'}>
          {specialties.map((slide, index) => <button key={slide.title} aria-label={arabic ? slide.arabicTitle : slide.title} aria-current={active === index ? 'true' : undefined} onClick={() => manualMove(index + 1)}><span /></button>)}
        </div>
      </div>
    </section>
  )
}
