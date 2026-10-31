import { useRef } from 'react'
import useTimelineBean from './useTimelineBean'

const moments = [
  { time: '16:00', label: '4:00 PM', arabicTime: '٤:٠٠ م', icon: 'ribbon', title: 'Ribbon Cutting & Welcome', arabicTitle: 'قص الشريط والترحيب' },
  { time: '16:30', label: '4:30 PM', arabicTime: '٤:٣٠ م', icon: 'coffee', title: 'Coffee Tasting', arabicTitle: 'تذوّق القهوة', subtitle: 'With our baristas', arabicSubtitle: 'مع خبراء تحضير القهوة' },
  { time: '17:30', label: '5:30 PM', arabicTime: '٥:٣٠ م', icon: 'music', title: 'Live Acoustic Music', arabicTitle: 'موسيقى أكوستيك حيّة' },
  { time: '19:00', label: '7:00 PM', arabicTime: '٧:٠٠ م', icon: 'pastry', title: 'Pastry & Dessert Tasting', arabicTitle: 'تذوّق المخبوزات والحلويات' },
  { time: '20:30', label: '8:30 PM', arabicTime: '٨:٣٠ م', icon: 'gift', title: 'Opening Gifts', arabicTitle: 'هدايا الافتتاح', subtitle: 'A little something for every guest', arabicSubtitle: 'هدية صغيرة لكل ضيف' },
]

function MomentIcon({ type }: { type: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className="opening-day__icon" aria-hidden="true">
      {type === 'ribbon' && <><circle cx="9" cy="23" r="4" /><circle cx="23" cy="23" r="4" /><path d="m11 19 11-16M21 19 10 3M3 11c8 4 18-4 26 0" /></>}
      {type === 'coffee' && <><path d="M5 13h18v7a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7v-7ZM23 14h3a4 4 0 0 1 0 8h-3M3 30h25M10 3c-3 3 3 3 0 6M16 2c-3 3 3 3 0 6" /></>}
      {type === 'music' && <><path d="M12 25V7l15-4v19M12 12l15-4" /><ellipse cx="8" cy="25" rx="4" ry="3" /><ellipse cx="23" cy="22" rx="4" ry="3" /></>}
      {type === 'pastry' && <><path d="M11 10c3-2 7-2 10 0l2 14c-4 2-10 2-14 0l2-14ZM10 12C5 12 2 18 2 23c2 2 4 1 7-1M22 12c5 0 8 6 8 11-2 2-4 1-7-1M16 9v16" /></>}
      {type === 'gift' && <><rect x="3" y="11" width="26" height="6" rx="1" /><path d="M5 17v13h22V17M16 11v19M16 11C8 12 5 8 7 5s8-1 9 6ZM16 11c8 1 11-3 9-6s-8-1-9 6Z" /></>}
    </svg>
  )
}

export default function OpeningDay({ arabic, paused }: { arabic: boolean; paused: boolean }) {
  const timeline = useRef<HTMLDivElement>(null)
  useTimelineBean(timeline, paused, arabic)
  return (
    <section className="opening-day" aria-labelledby="opening-day-heading" dir={arabic ? 'rtl' : 'ltr'}>
      <header className="opening-day__heading">
        <h2 id="opening-day-heading" data-scroll-reveal><em>{arabic ? 'برنامج' : 'Opening'}</em><span>{arabic ? 'يوم الافتتاح' : 'DAY'}</span></h2>
        <div className="brand__divider" aria-hidden="true"><span /></div>
        <p data-scroll-reveal>{arabic ? 'لحظات جميلة بانتظاركم.' : 'A few moments to look forward to.'}</p>
      </header>
      <div className="opening-day__timeline-wrap" ref={timeline}>
      <ol className="opening-day__timeline">
        {moments.map((moment, index) => (
          <li className="opening-day__moment" key={moment.time} data-scroll-reveal>
            <time dateTime={`2026-11-15T${moment.time}:00+03:00`}>{arabic ? moment.arabicTime : moment.label}</time>
            <span className={`opening-day__marker${index < 3 ? ' opening-day__marker--filled' : ''}`} aria-hidden="true">
              <span />
            </span>
            <div className="opening-day__details">
              <MomentIcon type={moment.icon} />
              <div><h3>{arabic ? moment.arabicTitle : moment.title}</h3>{moment.subtitle && <p>{arabic ? moment.arabicSubtitle : moment.subtitle}</p>}</div>
            </div>
          </li>
        ))}
      </ol>
      <svg className="opening-day__bean" viewBox="0 0 24 38" fill="none" aria-hidden="true">
        <defs><linearGradient id="timeline-bean-color" x1="2" y1="5" x2="22" y2="34" gradientUnits="userSpaceOnUse"><stop stopColor="#b77b52" /><stop offset=".45" stopColor="#4d2114" /><stop offset=".7" stopColor="#976043" /><stop offset="1" stopColor="#3b1a10" /></linearGradient></defs>
        <ellipse cx="12" cy="19" rx="10" ry="17" fill="url(#timeline-bean-color)" />
        <path d="M13 3C4 13 20 20 10 35" stroke="#29130c" strokeWidth="2" /><path d="M15 4C7 13 22 22 12 34" stroke="#dba17b" strokeWidth="1" />
      </svg>
      </div>
    </section>
  )
}
