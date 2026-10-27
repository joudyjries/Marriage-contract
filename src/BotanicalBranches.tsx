import type { CSSProperties } from 'react'

const sprigs = [
  { side: 'left', top: 22, width: 23, angle: -32, duration: 5.8, delay: 0 },
  { side: 'left', top: 35, width: 24, angle: 12, duration: 6.6, delay: -.9 },
  { side: 'left', top: 49, width: 25, angle: 5, duration: 6.1, delay: -2.2 },
  { side: 'right', top: 22, width: 23, angle: -32, duration: 6.2, delay: -1.5 },
  { side: 'right', top: 35, width: 24, angle: 12, duration: 7, delay: -2.4 },
  { side: 'right', top: 49, width: 25, angle: 5, duration: 6.5, delay: -.7 },
]

export default function BotanicalBranches({ visible }: { visible: boolean }) {
  return <>
    <div className={`side-branches ${visible ? 'is-visible' : ''}`} aria-hidden="true">
      {sprigs.map((sprig, index) => (
        <div className={`branch-spray branch-spray--${sprig.side}`} key={index} style={{
          top: `${sprig.top}%`, width: `${sprig.width}%`,
          '--sprig-angle': `${sprig.angle}deg`,
          '--sprig-duration': `${sprig.duration}s`,
          '--sprig-delay': `${sprig.delay}s`,
        } as CSSProperties}>
          <div className="branch-breeze">
            <img className="reference-sprig" src="/images/reference-side-sprig.png" alt="" draggable="false" />
          </div>
        </div>
      ))}
    </div>
    {visible && <div className="falling-petals" aria-hidden="true">
      {sprigs.flatMap((sprig, index) =>
        Array.from({ length: 6 }, (_, i) => (
          <i className="falling-petal" key={`${index}-${i}`} style={{
            left: `${sprig.side === 'left' ? 3 + i % 3 * 3 : 97 - i % 3 * 3}%`,
            top: `${sprig.top + 3 + i % 2 * 2}%`,
            width: `${1.1 + (i % 3) * .25}cqw`,
            '--petal-delay': `${i * .5 + index * .25}s`,
            '--petal-duration': `${5.5 + (i % 4) * .7}s`,
            '--petal-drift': `${(sprig.side === 'left' ? 1 : -1) * (10 + i % 5 * 3)}cqw`,
            '--petal-turn': `${i % 2 ? 290 : -240}deg`,
          } as CSSProperties} />
        ))
      )}
    </div>}
  </>
}
