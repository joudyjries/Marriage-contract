import { useEffect, useRef } from 'react'
import { createRingVideo } from './media/createRingVideo'

export default function RingScene({ spinning, onMessageVisibilityChange, onInvitationVisibilityChange }: { spinning: boolean; onMessageVisibilityChange: (visible: boolean) => void; onInvitationVisibilityChange: (visible: boolean) => void }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const spinningRef = useRef(spinning)

  useEffect(() => { spinningRef.current = spinning }, [spinning])

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    try {
      return createRingVideo(host, canvas, () => spinningRef.current, onMessageVisibilityChange, onInvitationVisibilityChange)
    } catch {
      // The matching rendered poster stays visible on unsupported devices.
    }
  }, [onMessageVisibilityChange, onInvitationVisibilityChange])

  return (
    <div className="ring-renderer ring-renderer--recorded" ref={hostRef} aria-hidden="true">
      <div className="ring-canvas"><canvas ref={canvasRef} width={260} height={178} /></div>
      <div className="ring-fallback">
        <img src="/images/ring-recorded-loop-poster.png" alt="" decoding="async" />
      </div>
    </div>
  )
}
