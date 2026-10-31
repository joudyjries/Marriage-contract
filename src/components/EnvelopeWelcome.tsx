import { useEffect, useState } from 'react'
import './envelope.css'

type Props = { onStart: () => void; onOpened: () => void }

export default function EnvelopeWelcome({ onStart, onOpened }: Props) {
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  useEffect(() => {
    if (!opening) return
    const timer = window.setTimeout(onOpened, 1950)
    return () => window.clearTimeout(timer)
  }, [opening, onOpened])

  return (
    <section className={`invitation-welcome envelope${opening ? ' envelope--opening' : ''}`}
      dir="rtl" aria-label="ظرف دعوة الزفاف" aria-busy={opening}>
      <svg className="envelope__definitions" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="envelope-left-edge" clipPathUnits="objectBoundingBox">
            <path d="M0 0H.48C.47 .06 .60 .08 .53 .16C.45 .19 .59 .25 .52 .32C.45 .36 .60 .41 .52 .49C.45 .53 .59 .59 .52 .66C.45 .70 .59 .75 .52 .82C.45 .87 .56 .93 .48 1H0Z" />
          </clipPath>
          <clipPath id="envelope-right-edge" clipPathUnits="objectBoundingBox">
            <path d="M.48 0C.47 .06 .60 .08 .53 .16C.45 .19 .59 .25 .52 .32C.45 .36 .60 .41 .52 .49C.45 .53 .59 .59 .52 .66C.45 .70 .59 .75 .52 .82C.45 .87 .56 .93 .48 1H1V0Z" />
          </clipPath>
        </defs>
      </svg>
      <div className="envelope__stage">
        <div className="envelope__lining" aria-hidden="true" />
        <div className="envelope__inner-flap" aria-hidden="true" />
        <div className="envelope__wing envelope__wing--left" aria-hidden="true"><div className="envelope__paper" /></div>
        <div className="envelope__wing envelope__wing--right" aria-hidden="true"><div className="envelope__paper" /></div>
        <button className="invitation-welcome__open envelope__seal" type="button"
          disabled={opening} aria-label="افتح دعوة زفاف ديفيد وآنا"
          onClick={() => {
            if (opening) return
            // Unlock audio in this click; its first five seconds are silent.
            onStart()
            setOpening(true)
          }}>
          <img src="/images/envelope-swan-seal-pink.png" alt="ختم زهري مزخرف ببجعتين" fetchPriority="high" draggable="false" />
        </button>
        <p className="envelope__hint">المس الختم لفتح الدعوة</p>
      </div>
      <span className="sr-only" role="status">{opening ? 'يُفتح الظرف وتبدأ الدعوة' : 'اضغط على الختم لفتح الظرف وبدء الدعوة والموسيقى'}</span>
    </section>
  )
}
