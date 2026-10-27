import { useEffect, useRef, useState } from 'react'
import './scene.css'
import WaterGarden from './WaterGarden'
import useWeddingAudio from './useWeddingAudio'

const pearls = {
  left: [[14.5, 8.2, -.15, 12], [26, 62.7, -2.5, 13], [64, 47.7, -1.3, 10], [12, 84.5, -3.6, 9]],
  right: [[66.8, 22.5, -1.35, 14], [81.5, 76.5, -3.65, 12], [89, 39, -2.6, 9], [86.7, 84.8, -.25, 9]],
}

function PearlLight({ side }: { side: 'left' | 'right' }) {
  return <div className="pearl-lights" aria-hidden="true">
    {pearls[side].map(([x, y, delay, size]) => (
      <i key={`${x}-${y}`} style={{ left: `${x}%`, top: `${y}%`, width: `${size}%`, animationDelay: `${delay}s` }} />
    ))}
  </div>
}

export default function App() {
  const { audioRef, finishSoundtrack, restartSoundtrack } = useWeddingAudio()
  const [envelopeReady, setEnvelopeReady] = useState(false)
  const [gardenReady, setGardenReady] = useState(false)
  const [swansReady, setSwansReady] = useState(false)
  const [monogramReady, setMonogramReady] = useState(false)
  const [branchesReady, setBranchesReady] = useState(false)
  const ready = envelopeReady && gardenReady && swansReady && monogramReady && branchesReady
  const [open, setOpen] = useState(false)
  const [invitationPhase, setInvitationPhase] = useState(0)
  const [replay, setReplay] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!ready) return
    timer.current = setTimeout(() => setOpen(true), 4800)
    return () => clearTimeout(timer.current)
  }, [ready, replay])

  useEffect(() => {
    if (!open) return
    const logoTimer = setTimeout(() => setInvitationPhase(1), 3200)
    const dateTimer = setTimeout(() => setInvitationPhase(2), 4600)
    const branchesTimer = setTimeout(() => setInvitationPhase(3), 13800)
    const blessingTimer = setTimeout(() => setInvitationPhase(4), 18500)
    const verseTimer = setTimeout(() => setInvitationPhase(5), 27000)
    const coupleTimer = setTimeout(() => setInvitationPhase(6), 35500)
    const detailsTimer = setTimeout(() => setInvitationPhase(7), 47500)
    const noticeTimer = setTimeout(() => setInvitationPhase(8), 57000)
    const closingTimer = setTimeout(() => setInvitationPhase(9), 65000)
    return () => {
      clearTimeout(logoTimer)
      clearTimeout(dateTimer)
      clearTimeout(branchesTimer)
      clearTimeout(blessingTimer)
      clearTimeout(verseTimer)
      clearTimeout(coupleTimer)
      clearTimeout(detailsTimer)
      clearTimeout(noticeTimer)
      clearTimeout(closingTimer)
    }
  }, [open, replay])

  function openEnvelope() {
    clearTimeout(timer.current)
    setOpen(true)
  }

  function restart() {
    restartSoundtrack()
    setOpen(false)
    setInvitationPhase(0)
    setReplay(value => value + 1)
  }

  return (
    <main className={`scene ${ready ? 'is-ready' : ''} ${open ? 'is-open' : ''}`} dir="rtl">
      <audio ref={audioRef} src="/audio/wedding-song-v3.m4a" loop preload="auto" />
      <img className="asset-preload" src="/images/ivory-envelope.png" alt="" onLoad={() => setEnvelopeReady(true)} />
      <img className="asset-preload" src="/images/ivory-pool.png" alt="" onLoad={() => setGardenReady(true)} />
      <img className="asset-preload" src="/images/swan-cutout.png" alt="" onLoad={() => setSwansReady(true)} />
      <img className="asset-preload" src="/images/wedding-monogram.png" alt="" onLoad={() => setMonogramReady(true)} />
      <img className="asset-preload" src="/images/reference-side-sprig.png" alt="" onLoad={() => setBranchesReady(true)} />
      <img className="asset-preload" src="/images/couple-names-delicate.png" alt="" />
      <img className="asset-preload" src="/images/event-calendar.png" alt="" />
      <img className="asset-preload" src="/images/event-clock.png" alt="" />
      <img className="asset-preload" src="/images/event-location.png" alt="" />
      <div className="ambient-light" aria-hidden="true" />
      <div className="envelope-stage">
        <div className="envelope" aria-label="ظرف عاجي مطرّز بالورود واللؤلؤ">
          <WaterGarden open={open} invitationPhase={invitationPhase} onComplete={finishSoundtrack} />
          <div className="flap flap--top" aria-hidden="true">
            <div className="flap-face flap-face--front" />
            <div className="flap-face flap-face--back" />
          </div>
          <div className="flap flap--bottom" aria-hidden="true">
            <div className="flap-face flap-face--front" />
            <div className="flap-face flap-face--back" />
          </div>
          <div className="flap flap--right" aria-hidden="true">
            <div className="flap-face flap-face--front"><PearlLight key={`right-${replay}`} side="right" /></div>
            <div className="flap-face flap-face--back" />
          </div>
          <div className="flap flap--left" aria-hidden="true">
            <div className="flap-face flap-face--front"><PearlLight key={`left-${replay}`} side="left" /></div>
            <div className="flap-face flap-face--back" />
          </div>
          <button className="open-envelope" onClick={openEnvelope} disabled={!ready || open} aria-label="فتح طيّات الظرف الأربع" />
        </div>
      </div>
      <div className="scene-caption" aria-live="polite">
        {open ? <button className="replay" onClick={restart}><span aria-hidden="true">↺</span> إعادة المشهد</button>
          : <button className="open-hint" onClick={openEnvelope} disabled={!ready}>لمسة لتبدأ الحكاية</button>}
      </div>
    </main>
  )
}
