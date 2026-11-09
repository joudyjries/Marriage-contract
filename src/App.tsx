import { lazy, Suspense, useState } from 'react'
import './index.css'

const RingScene = lazy(() => import('./RingScene'))
const framePath = 'M85 8H355V32Q355 40 369 45Q401 56 407 89H438V631H407Q401 664 369 675Q355 680 355 688V712H85V688Q85 680 71 675Q39 664 33 631H2V89H33Q39 56 71 45Q85 40 85 32Z'

export default function App() {
  const [ready, setReady] = useState(false)
  const [ringVisible, setRingVisible] = useState(false)
  const [messageVisible, setMessageVisible] = useState(false)
  const [invitationVisible, setInvitationVisible] = useState(false)

  return (
    <main className={`opening-screen${ready ? ' is-ready' : ''}`} aria-label="شاشة البداية">
      <h1 className="visually-hidden">مرحباً بك</h1>
      <img className="pearl-background" src="/images/rose-pearl.png" alt="" fetchPriority="high" decoding="async" onLoad={() => setReady(true)} onError={() => setReady(true)} />
      <div className="pearl-light" aria-hidden="true" />
      <section className="invitation-card" aria-label="خاتم ألماس يظهر بلونه الكامل ويدور ثم يكبر وينزل مع انعكاسه داخل إطار خمري">
        <svg className="card-frame" viewBox="0 0 440 720" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="wine" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#421127" />
              <stop offset=".5" stopColor="#3b1024" />
              <stop offset="1" stopColor="#501d35" />
            </linearGradient>
            <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#76415b" />
              <stop offset=".45" stopColor="#250b1a" />
              <stop offset="1" stopColor="#69334e" />
            </linearGradient>
          </defs>
          <path d={framePath} fill="url(#wine)" stroke="#411429" strokeWidth="5" />
          <path d={framePath} transform="translate(7 7) scale(.968 .98)" fill="none" stroke="url(#edge)" strokeWidth="5" />
          <path d={framePath} transform="translate(15 17) scale(.932 .952)" fill="none" stroke="#240b19" strokeWidth="3" />
          <path d={framePath} transform="translate(19 22) scale(.914 .939)" fill="none" stroke="#854863" strokeOpacity=".48" strokeWidth="2" />
          <path className="frame-trace" d={framePath} transform="translate(19 22) scale(.914 .939)" fill="none" stroke="#c58ba7" strokeWidth="1" pathLength="1" />
        </svg>
        <div className="ring-stage" onAnimationStart={event => {
          if (event.animationName === 'ring-appear') setRingVisible(true)
        }}>
          {ready && <Suspense fallback={null}><RingScene spinning={ringVisible} onMessageVisibilityChange={setMessageVisible} onInvitationVisibilityChange={setInvitationVisible} /></Suspense>}
        </div>
        <p className={`ring-message${messageVisible ? ' is-visible' : ''}`} dir="rtl">
          <span>قُلْتُ نَعَــــم حينما أَفْتَى قَلْبي</span>
          <span>فَكان خَير جَواب لِخَير رَجُل</span>
        </p>
        <div className={`contract-copy${invitationVisible ? ' is-visible' : ''}`} dir="rtl">
          <p className="contract-line">سبحان من جمع القلوب بفضله</p>
          <p className="contract-line">وعلى رحاب الود عمر دارها</p>
          <p className="contract-line">الحمد لله الذي تتم بنعمته الصالحات و</p>
          <p className="contract-line">بكرمه تتبارك الأرزاق تم بفضل الله</p>
          <p className="contract-title">عقــد قــراني</p>
          <p className="contract-line">اللهم اجعله عقداً تنعقد به سعادتنا</p>
        </div>
      </section>
    </main>
  )
}
