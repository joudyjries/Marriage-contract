import { useCallback, useEffect, useRef, useState } from 'react'

export default function useInvitationMusic() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const userPaused = useRef(false)
  const [playing, setPlaying] = useState(false)

  const startMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio || userPaused.current) return
    // Browsers may require a real interaction before allowing audible playback.
    void audio.play().catch(() => {})
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = .6
    const interactionEvents = ['pointerdown', 'pointerup', 'click', 'keydown'] as const

    function retryOnInteraction(event: Event) {
      if (event.target instanceof Element && event.target.closest('[data-music-toggle]')) return
      startMusic()
    }
    function removeInteractionListeners() {
      interactionEvents.forEach(type => document.removeEventListener(type, retryOnInteraction, true))
    }
    function onPlaying() {
      setPlaying(true)
      removeInteractionListeners()
    }
    function onStopped() { setPlaying(false) }

    interactionEvents.forEach(type => document.addEventListener(type, retryOnInteraction, { capture: true, passive: true }))
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onStopped)
    audio.addEventListener('ended', onStopped)
    audio.addEventListener('error', onStopped)
    startMusic()
    return () => {
      removeInteractionListeners()
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onStopped)
      audio.removeEventListener('ended', onStopped)
      audio.removeEventListener('error', onStopped)
      audio.pause()
    }
  }, [startMusic])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      userPaused.current = false
      startMusic()
    } else {
      userPaused.current = true
      audio.pause()
    }
  }, [startMusic])

  return { audioRef, playing, startMusic, toggleMusic }
}
