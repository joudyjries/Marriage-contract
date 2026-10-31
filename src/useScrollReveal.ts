import { useEffect } from 'react'
import type { RefObject } from 'react'

export default function useScrollReveal(container: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !container.current) return
    const elements = container.current.querySelectorAll<HTMLElement>('[data-scroll-reveal]')
    if (!('IntersectionObserver' in window)) {
      elements.forEach(element => element.setAttribute('data-revealed', 'true'))
      return
    }

    const observer = new IntersectionObserver(entries => {
      const visibleEntries = entries.filter(entry => entry.isIntersecting)
      visibleEntries.forEach((entry, index) => {
        const element = entry.target as HTMLElement
        element.style.setProperty('--reveal-delay', `${Math.min(index * 120, 360)}ms`)
        element.setAttribute('data-revealed', 'true')
        observer.unobserve(element)
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' })

    elements.forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [container, enabled])
}
