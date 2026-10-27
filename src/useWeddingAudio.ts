import { useCallback, useEffect, useRef } from 'react'

export default function useWeddingAudio() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const finished = useRef(false)

  const play = useCallback(() => {
    const audio = audioRef.current
    if (!audio || finished.current || document.visibilityState !== 'visible') return
    // A blocked autoplay attempt is retried synchronously on the next gesture.
    void audio.play().catch(() => {})
  }, [])

  const finishSoundtrack = useCallback(() => {
    finished.current = true
    audioRef.current?.pause()
  }, [])

  const restartSoundtrack = useCallback(() => {
    finished.current = false
    if (audioRef.current) audioRef.current.currentTime = 0
    play()
  }, [play])

  useEffect(() => {
    const audio = audioRef.current
    const pause = () => audio?.pause()
    const visibilityChanged = () => {
      if (document.visibilityState === 'hidden') pause()
      else play()
    }

    play()
    document.addEventListener('pointerdown', play)
    document.addEventListener('touchend', play)
    document.addEventListener('keydown', play)
    document.addEventListener('visibilitychange', visibilityChanged)
    window.addEventListener('pagehide', pause)
    window.addEventListener('pageshow', play)

    return () => {
      pause()
      document.removeEventListener('pointerdown', play)
      document.removeEventListener('touchend', play)
      document.removeEventListener('keydown', play)
      document.removeEventListener('visibilitychange', visibilityChanged)
      window.removeEventListener('pagehide', pause)
      window.removeEventListener('pageshow', play)
    }
  }, [play])

  return { audioRef, finishSoundtrack, restartSoundtrack }
}
