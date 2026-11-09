export const turnDuration = 8000
export const settleDuration = 3500
export const messageDuration = 2000
const initialAngle = 2.5

export function ringIntroAt(elapsed: number, endOpacity = .25) {
  const turn = Math.max(0, Math.min(1, elapsed / turnDuration))
  const rawSettle = Math.max(0, Math.min(1, (elapsed - turnDuration) / settleDuration))
  const settle = rawSettle * rawSettle * (3 - 2 * rawSettle)
  return {
    angle: initialAngle - Math.PI * 2 * turn,
    scale: .5 + settle * .25,
    drop: settle * 12,
    opacity: 1 + (endOpacity - 1) * settle,
    phase: turn < 1 ? 'turning' : rawSettle < 1 ? 'settling' : 'complete',
  }
}
