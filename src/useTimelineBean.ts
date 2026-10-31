import { useEffect } from 'react'
import type { RefObject } from 'react'

function dotCenter(dot: HTMLElement, container: HTMLElement) {
  let x = dot.offsetWidth / 2
  let y = dot.offsetHeight / 2
  let element: HTMLElement | null = dot
  // Read layout offsets so row entrance animations do not shift the path.
  while (element && element !== container) {
    x += element.offsetLeft
    y += element.offsetTop
    element = element.offsetParent as HTMLElement | null
  }
  return { x, y }
}

export default function useTimelineBean(container: RefObject<HTMLDivElement | null>, paused: boolean, arabic: boolean) {
  useEffect(() => {
    const wrapper = container.current
    if (!wrapper) return
    const bean = wrapper.querySelector<SVGElement>('.opening-day__bean')
    const dots = wrapper.querySelectorAll<HTMLElement>('.opening-day__marker > span')
    if (!bean || dots.length < 2) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame: number | undefined
    let disposed = false

    function update() {
      frame = undefined
      if (!wrapper || !bean) return
      const first = dotCenter(dots[0], wrapper)
      const last = dotCenter(dots[dots.length - 1], wrapper)
      const viewportHeight = document.documentElement.clientHeight
      const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY
      const start = wrapperTop + first.y - viewportHeight * .78
      const pageEnd = document.documentElement.scrollHeight - viewportHeight
      const end = Math.max(start + 1, Math.min(wrapperTop + last.y - viewportHeight * .32, pageEnd))
      const progress = Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)))
      if (!paused || !bean.style.getPropertyValue('--bean-y')) {
        const y = motion.matches ? first.y : first.y + progress * (last.y - first.y)
        bean.style.setProperty('--bean-y', `${y}px`)
      }
      bean.style.setProperty('--bean-x', `${first.x}px`)
    }

    function schedule() {
      if (!disposed && frame === undefined) frame = requestAnimationFrame(update)
    }

    const resize = new ResizeObserver(schedule)
    resize.observe(wrapper)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    motion.addEventListener('change', schedule)
    void document.fonts.ready.then(schedule)
    update()
    return () => {
      disposed = true
      if (frame !== undefined) cancelAnimationFrame(frame)
      resize.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      motion.removeEventListener('change', schedule)
    }
  }, [container, paused, arabic])
}
