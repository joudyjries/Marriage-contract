import { useId } from 'react'
import BotanicalBranches from './BotanicalBranches'
import EventDetails from './EventDetails'

const fountainStreams = [
  'M50 9 Q54 18 51 38', 'M37 44 Q31 60 33 81', 'M63 44 Q69 60 67 81',
  'M25 81 Q13 105 15 163', 'M75 81 Q87 105 85 163',
  'M36 84 Q30 118 32 170', 'M64 84 Q70 118 68 170', 'M48 86 L48 169', 'M53 86 L53 169',
]

export default function WaterGarden({ open, invitationPhase, onComplete }: { open: boolean; invitationPhase: number; onComplete: () => void }) {
  const id = useId().replace(/:/g, '')
  const ripple = `water-ripple-${id}`
  const feather = `water-feather-${id}`
  return (
    <div className={`garden-scene ${invitationPhase >= 3 ? 'has-branches' : ''} ${invitationPhase >= 5 ? 'has-text-scene' : ''} ${invitationPhase >= 6 ? 'has-couple-scene' : ''}`} role="img" aria-hidden={!open} aria-label="حديقة عاجية بأغصان على الأطراف ونافورة جارية وبجعتين متقاربتين تسبحان بهدوء">
      <svg className="pool-water" viewBox="94 1421 753 217" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id={ripple} filterUnits="userSpaceOnUse" x="80" y="1400" width="790" height="260" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency=".012 .075" numOctaves="2" seed="8" result="waves">
              <animate attributeName="baseFrequency" values=".012 .075;.015 .085;.012 .075" dur="8s" repeatCount="indefinite" />
            </feTurbulence>
            <feOffset in="waves" result="current">
              <animate attributeName="dx" values="-7;7;-7" dur="12s" repeatCount="indefinite" />
            </feOffset>
            <feDisplacementMap in="SourceGraphic" in2="current" scale="7" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <radialGradient id={feather}>
            <stop offset="0" stopColor="white" />
            <stop offset="65%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </radialGradient>
          <mask id={`${feather}-mask`} maskUnits="userSpaceOnUse" x="94" y="1421" width="753" height="217">
            <ellipse cx="470.5" cy="1529.5" rx="376.5" ry="108.5" fill={`url(#${feather})`} />
          </mask>
        </defs>
        <g mask={`url(#${feather}-mask)`}>
          <image href="/images/ivory-pool.png" x="0" y="0" width="941" height="1672" preserveAspectRatio="none" filter={`url(#${ripple})`} />
        </g>
      </svg>
      <svg className="fountain-flow" viewBox="0 0 100 180" preserveAspectRatio="none" aria-hidden="true">
        {fountainStreams.map((path, index) => (
          <g key={path}>
            <path className="water-stream" d={path} />
            <path className="water-glints" d={path} style={{ animationDelay: `${index * -.19}s` }} />
            <circle className="water-droplet" r=".65" fill="#fffdf4">
              <animateMotion path={path} dur={`${1.4 + index * .12}s`} begin={`${index * -.21}s`} repeatCount="indefinite" calcMode="linear" />
            </circle>
          </g>
        ))}
        <ellipse className="fountain-splash" cx="50" cy="172" rx="31" ry="4" />
      </svg>
      {(['left', 'right'] as const).map(side => (
        <div className={`swan-track swan-track--${side}`} key={side} aria-hidden="true">
          <div className="swan-wake" />
          <div className="swan-facing">
            <img className="swan-bird" src="/images/swan-cutout.png" alt="" draggable="false" />
            <div className="swan-reflection"><img src="/images/swan-cutout.png" alt="" draggable="false" /></div>
          </div>
        </div>
      ))}
      <BotanicalBranches visible={invitationPhase >= 3 && invitationPhase < 6} />
      <div className={`invitation-reveal ${invitationPhase ? 'has-monogram' : ''} ${invitationPhase > 1 ? 'has-date' : ''} ${invitationPhase >= 4 ? 'has-blessing' : ''} ${invitationPhase >= 5 ? 'has-text' : ''} ${invitationPhase >= 6 ? 'has-couple' : ''} ${invitationPhase >= 7 ? 'has-details' : ''} ${invitationPhase >= 8 ? 'has-notice' : ''} ${invitationPhase >= 9 ? 'has-closing' : ''}`} aria-hidden="true">
        <div className="edge-shimmers" aria-hidden="true">
          {[.25, 1.25, 2.25, 3.25, 4.25, 5.25].flatMap((delay, index) =>
            ['left', 'right'].map(side => (
              <i key={`${index}-${side}`} className={`edge-shimmer edge-shimmer--${side}`} style={{ animationDelay: `${delay}s` }} />
            ))
          )}
        </div>
        <span className="invitation-flash invitation-flash--logo" />
        <img className="wedding-monogram" src="/images/wedding-monogram.png" alt="" draggable="false" />
        <span className="invitation-flash invitation-flash--date" />
        <span className="wedding-date">14 · 11 · 2026</span>
        <section className="blessing-copy" lang="ar" dir="rtl" aria-label="بسم الله الرحمن الرحيم، وجعل بينكم مودة ورحمة">
          <div className="blessing-group blessing-bismillah">
            <svg viewBox="0 0 700 160" role="img" aria-label="بسم الله الرحمن الرحيم">
              <text x="350" y="115" textAnchor="middle">﷽</text>
            </svg>
          </div>
          <div className="blessing-group blessing-verse">
            <span className="blessing-ornament" aria-hidden="true">۞</span>
            <span>وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً</span>
            <span className="blessing-ornament" aria-hidden="true">۞</span>
          </div>
          <div className="blessing-group blessing-translation" lang="en" dir="ltr">
            <span>AND HE PLACED BETWEEN</span>
            <span>YOU AFFECTION AND MERCY.</span>
          </div>
        </section>
        <div className="verse-copy">
          <div className="verse-group verse-group--line1">
            <span className="verse-line verse-line--poem" lang="ar" dir="rtl">ما بين صدفة جمعت الطرق</span>
          </div>
          <div className="verse-group verse-group--line2">
            <span className="verse-line verse-line--poem" lang="ar" dir="rtl">وقدّر رتّب اللقاء</span>
          </div>
          <div className="verse-group verse-group--line3">
            <span className="verse-line verse-line--poem" lang="ar" dir="rtl">كتبت حكاية</span>
          </div>
          <div className="verse-group verse-group--line4">
            <span className="verse-line verse-line--poem" lang="ar" dir="rtl">كان الحب فيها</span>
          </div>
          <div className="verse-group verse-group--line5">
            <span className="verse-line verse-line--poem" lang="ar" dir="rtl">أجمل بداية</span>
          </div>
        </div>
        <section className="couple-invitation" lang="ar" dir="rtl" aria-label="دعوة زفاف">
          <div className="couple-block couple-heading">
            <span className="couple-line couple-line--welcome">بكل سرور ومحبة</span>
            <span className="couple-line couple-line--honor">يتشرف</span>
          </div>
          <div className="couple-block couple-parents" dir="ltr">
            <div className="parent-name" dir="rtl"><span>السيد</span><span>أحمد الأحمد</span></div>
            <span className="parents-and">و</span>
            <div className="parent-name" dir="rtl"><span>السيد</span><span>خالد العبدالله</span></div>
          </div>
          <div className="couple-block couple-message">
            <span className="couple-line couple-line--invite">بدعوتكم لمشاركتهم</span>
            <span className="couple-line couple-line--celebrate">فرحة زفاف أبنائهم</span>
          </div>
          <div className="couple-block couple-names">
            <img src="/images/couple-names-delicate.png" alt="أريج وخالد" draggable="false" />
          </div>
        </section>
        <EventDetails />
        <section className="guest-notice" lang="ar" dir="rtl" aria-label="تنويه للضيوف">
          <div className="notice-line notice-line--one">لجمال أمسيتنا وخصوصيتها</div>
          <div className="notice-line notice-line--two">نأمل منكم بكل ودّ</div>
          <div className="notice-line notice-line--three">عدم اصطحاب الأطفال</div>
        </section>
        <section className="closing-scene" aria-label="ختام الدعوة">
          <img className="closing-monogram" src="/images/wedding-monogram.png" alt="" draggable="false" />
          <span className="closing-date" onAnimationEnd={event => {
            if (event.animationName === 'date-arrive') onComplete()
          }}>14 · 11 · 2026</span>
        </section>
      </div>
    </div>
  )
}
