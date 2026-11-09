import { ringIntroAt, settleDuration, turnDuration } from '../three/ringIntro'

import { messageDuration } from '../three/ringIntro'

const recordedTurnDuration = 2800

const vertexSource = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * .5 + .5;
  gl_Position = vec4(aPosition, 0., 1.);
}`
const fragmentSource = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uVideo;
void main() {
  vec3 color = texture2D(uVideo, vec2(vUv.x * .5, vUv.y)).rgb;
  float alpha = texture2D(uVideo, vec2(.5 + vUv.x * .5, vUv.y)).r;
  if (alpha < .015) discard;
  vec3 key = texture2D(uVideo, vec2(.005, .01)).rgb;
  // The recording is packed over this same matte colour. Preserve its RGB tint.
  vec3 premultiplied = clamp(color - key * (1. - alpha), vec3(0.), vec3(alpha));
  gl_FragColor = vec4(premultiplied, alpha);
}`

export function createRingVideo(host: HTMLDivElement, canvas: HTMLCanvasElement, isActive: () => boolean, onMessageVisibilityChange: (visible: boolean) => void, onInvitationVisibilityChange: (visible: boolean) => void) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'low-power' })
  if (!gl) return () => {}
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)
    if (!shader) throw new Error('Cannot create ring video shader')
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader)
      gl.deleteShader(shader)
      throw new Error(error || 'Ring video shader did not compile')
    }
    return shader
  }
  const vertex = compile(gl.VERTEX_SHADER, vertexSource)
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  if (!program) throw new Error('Cannot create ring video program')
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Cannot link ring video program')
  gl.useProgram(program)
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.uniform1i(gl.getUniformLocation(program, 'uVideo'), 0)
  gl.clearColor(0, 0, 0, 0)

  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.loop = true
  video.preload = 'auto'
  video.setAttribute('webkit-playsinline', '')
  video.setAttribute('aria-hidden', 'true')
  video.className = 'ring-video-source'
  host.appendChild(video)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let disposed = false
  let request = 0
  let previousTime = 0
  let playbackElapsed = 0
  let lastVideoTime = -1
  let lastPhaseTime = -1
  let visible = true
  let playPending = false
  let playBlocked = false
  let messageVisible = false
  let invitationVisible = false
  const onError = () => {
    host.dataset.videoError = 'unavailable'
    delete host.dataset.ready
  }
  const onVisibilityChange = () => { if (document.hidden) video.pause() }
  const onInteraction = () => { playBlocked = false }
  const onSeeked = () => { lastVideoTime = -1 }
  const onMotionChange = () => {
    if (reducedMotion.matches) {
      video.pause()
      video.currentTime = 0
      playbackElapsed = 0
    }
  }
  video.addEventListener('error', onError)
  video.addEventListener('seeked', onSeeked)
  document.addEventListener('visibilitychange', onVisibilityChange)
  document.addEventListener('pointerdown', onInteraction, { passive: true })
  reducedMotion.addEventListener('change', onMotionChange)
  video.src = '/videos/ring-recorded-loop-vivid.mp4'
  video.load()

  function animate(time: number) {
    if (disposed) return
    request = requestAnimationFrame(animate)
    const delta = previousTime ? Math.min(time - previousTime, 100) : 0
    previousTime = time
    const active = isActive() && visible && !document.hidden && !reducedMotion.matches
    if (active && video.paused && !playPending && !playBlocked && video.readyState >= 2) {
      playPending = true
      void video.play().catch(() => { playBlocked = true }).finally(() => { playPending = false })
    } else if (!active && !video.paused) video.pause()
    if (!visible || document.hidden || !gl || video.readyState < 2) return
    if (active && !video.paused && !video.seeking) playbackElapsed += delta
    // Keep the intro timeline separate from the continuously looping rotation.
    const showInvitation = !reducedMotion.matches && playbackElapsed >= recordedTurnDuration
    if (showInvitation !== invitationVisible) {
      invitationVisible = showInvitation
      onInvitationVisibilityChange(showInvitation)
    }
    const showMessage = !reducedMotion.matches && !showInvitation
      && playbackElapsed >= recordedTurnDuration - messageDuration
    if (showMessage !== messageVisible) {
      messageVisible = showMessage
      onMessageVisibilityChange(showMessage)
    }
    const phaseTime = reducedMotion.matches ? 0 : playbackElapsed < recordedTurnDuration
      ? playbackElapsed / recordedTurnDuration * turnDuration
      : Math.min(turnDuration + playbackElapsed - recordedTurnDuration, turnDuration + settleDuration)
    if (phaseTime !== lastPhaseTime) {
      const intro = ringIntroAt(phaseTime)
      host.style.setProperty('--ring-scale', String(intro.scale))
      host.style.setProperty('--ring-drop', `${intro.drop}%`)
      host.style.setProperty('--ring-opacity', String(intro.opacity))
      host.dataset.phase = intro.phase
      host.dataset.elapsed = String(Math.round(phaseTime))
      lastPhaseTime = phaseTime
    }
    if (video.currentTime === lastVideoTime) return
    const outputWidth = video.videoWidth / 2
    if (canvas.width !== outputWidth || canvas.height !== video.videoHeight) {
      canvas.width = outputWidth
      canvas.height = video.videoHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    lastVideoTime = video.currentTime
    host.dataset.ready = 'true'
    host.dataset.videoTime = video.currentTime.toFixed(3)
  }
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
  observer.observe(host)
  request = requestAnimationFrame(animate)
  return () => {
    disposed = true
    cancelAnimationFrame(request)
    observer.disconnect()
    reducedMotion.removeEventListener('change', onMotionChange)
    video.removeEventListener('error', onError)
    video.removeEventListener('seeked', onSeeked)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    document.removeEventListener('pointerdown', onInteraction)
    video.pause()
    video.removeAttribute('src')
    video.load()
    video.remove()
    gl.deleteTexture(texture)
    gl.deleteBuffer(buffer)
    gl.deleteProgram(program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    delete host.dataset.ready
    delete host.dataset.phase
    delete host.dataset.elapsed
    delete host.dataset.videoTime
    delete host.dataset.videoError
    host.style.removeProperty('--ring-scale')
    host.style.removeProperty('--ring-drop')
    host.style.removeProperty('--ring-opacity')
  }
}
