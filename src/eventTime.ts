// 4 PM in Damascus (UTC+03:00), independent of the visitor's time zone.
export const OPENING_TIME = '2026-11-15T16:00:00+03:00'

export function getCountdown(now = Date.now()) {
  const seconds = Math.max(0, Math.floor((Date.parse(OPENING_TIME) - now) / 1000))
  return [
    Math.floor(seconds / 86400),
    Math.floor((seconds % 86400) / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
}
