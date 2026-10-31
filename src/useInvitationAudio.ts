import { useEffect, useRef, useState } from 'react'

export default function useInvitationAudio() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error'>('loading')
  const toggleRef = useRef<() => void>(() => {})
  const beginRef = useRef<() => void>(() => {})

  useEffect(() => {
    // Use native media playback, as in the original invitation.
    const audio = new Audio('/audio/intro-delayed.wav')
    audio.autoplay = false
    audio.preload = 'auto'
    audio.setAttribute('playsinline', '')
    let disposed = false
    let userPaused = false
    let finished = false
    let activated = false
    let track: 'intro' | 'song' = 'intro'

    const play = () => {
      if (disposed || !activated || userPaused || finished || document.visibilityState !== 'visible') return
      void audio.play().catch(error => {
        if (disposed || error.name === 'AbortError') return
        setStatus(error.name === 'NotAllowedError' ? 'ready' : 'error')
      })
    }
    const playing = () => { if (!disposed) setStatus('playing') }
    const ready = () => {
      if (!disposed && audio.paused && !userPaused) setStatus('ready')
      play()
    }
    const ended = () => {
      if (track === 'intro') {
        track = 'song'
        // Reuse the media element when advancing to preserve playback permission.
        audio.src = '/audio/song.m4a'
        play()
      } else {
        finished = true
        setStatus('ended')
      }
    }
    const failed = () => { if (!disposed) setStatus('error') }
    audio.addEventListener('canplay', ready)
    audio.addEventListener('playing', playing)
    audio.addEventListener('ended', ended)
    audio.addEventListener('error', failed)
    document.addEventListener('visibilitychange', play)
    window.addEventListener('pageshow', play)

    beginRef.current = () => {
      if (activated) return
      activated = true
      // Call play synchronously in the opening button's click, preserving permission.
      play()
    }

    toggleRef.current = () => {
      if (!audio.paused) {
        userPaused = true
        audio.pause()
        setStatus('paused')
      } else {
        userPaused = false
        play()
      }
    }
    // Preload while the welcome screen is visible, without starting the soundtrack.
    audio.load()

    return () => {
      disposed = true
      toggleRef.current = () => {}
      beginRef.current = () => {}
      document.removeEventListener('visibilitychange', play)
      window.removeEventListener('pageshow', play)
      audio.removeEventListener('canplay', ready)
      audio.removeEventListener('playing', playing)
      audio.removeEventListener('ended', ended)
      audio.removeEventListener('error', failed)
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
    }
  }, [])

  return { status, begin: () => beginRef.current(), toggle: () => toggleRef.current() }
}
