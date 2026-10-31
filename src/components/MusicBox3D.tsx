import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createMusicBox } from './musicBoxModel'

const smooth = (t: number) => {
  const x = THREE.MathUtils.clamp(t,0,1)
  return x*x*x*(x*(x*6-15)+10)
}

type Presentation='box'|'pedestal'

export default function MusicBox3D({ open, presentation='box', onReady, onError, onSettled, onPresentationReady }: {
  open: boolean; presentation?: Presentation; onReady: () => void; onError: () => void; onSettled: (open: boolean) => void
  onPresentationReady?: (presentation: Presentation) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const desiredOpen = useRef(open)
  const desiredPresentation=useRef(presentation)
  const controller = useRef<{ setOpen: (value: boolean) => void; setPresentation: (value: Presentation) => void } | null>(null)
  const callbacks = useRef({ onReady, onError, onSettled, onPresentationReady })
  useEffect(() => { callbacks.current = { onReady, onError, onSettled, onPresentationReady } },[onReady,onError,onSettled,onPresentationReady])
  useEffect(() => { desiredOpen.current=open; controller.current?.setOpen(open) },[open])
  useEffect(() => { desiredPresentation.current=presentation; controller.current?.setPresentation(presentation) },[presentation])

  useEffect(() => {
    const container = host.current
    if (!container) return
    container.style.visibility='hidden'
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, stencil: true, powerPreference: 'high-performance' })
    } catch {
      callbacks.current.onError()
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5))
    renderer.setClearColor(0x000000,0)
    renderer.localClippingEnabled=true
    renderer.outputColorSpace=THREE.SRGBColorSpace
    renderer.toneMapping=THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure=.85
    renderer.info.autoReset=false
    renderer.domElement.setAttribute('aria-hidden','true')
    container.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35,1,.1,50)
    camera.position.set(0,7.85,8.8)
    camera.lookAt(0,2.35,0)
    scene.add(new THREE.HemisphereLight(0xffeee2,0x946974,1.1))
    const sunlight = new THREE.DirectionalLight(0xffe7cb,1.6)
    sunlight.position.set(-3,7,5)
    scene.add(sunlight)
    const fill = new THREE.DirectionalLight(0xffdce8,.4)
    fill.position.set(4,2,1)
    scene.add(fill)

    let cancelled=false
    let frame=0
    let previous=0
    let progress=0
    let requestedOpen=desiredOpen.current
    let activePresentation=desiredPresentation.current
    let pendingPresentation: Presentation | null=null
    let cameraDistance=Math.hypot(5.5,8.8)
    let angularVelocity=0
    let ready=false
    let settled: boolean | null=null
    let parts: Awaited<ReturnType<typeof createMusicBox>> | undefined
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)')

    const draw = (now: number) => {
      frame=0
      if (cancelled || !parts || document.hidden) return
      // A shader compilation or slow frame must never skip visible opening stages.
      const dt=previous ? Math.min((now-previous)/1000,.05) : 0
      previous=now
      const goal=requestedOpen ? 1 : 0
      const duration=requestedOpen ? 6 : 4.5
      // Opening is an explicitly requested interaction; always show its gradual motion.
      progress=THREE.MathUtils.clamp(progress+(requestedOpen ? dt : -dt)/duration,0,1)
      const lidAngle=smooth(progress)*Math.PI*.565
      parts.hinge.rotation.x=-lidAngle
      const lift=smooth((progress-.24)/.63)
      parts.turntable.position.y=THREE.MathUtils.lerp(-.55,.93,lift)
      parts.turntable.visible=progress>0
      const targetSpeed=activePresentation==='box' && progress>.9 && requestedOpen && !motion.matches ? Math.PI*2/12 : 0
      angularVelocity=activePresentation==='pedestal' || motion.matches ? 0 : THREE.MathUtils.lerp(angularVelocity,targetSpeed,1-Math.exp(-dt*3))
      parts.couple.rotation.y+=angularVelocity*dt
      // Mirror appears only when its physical reflective side faces the viewer.
      parts.mirror.visible=activePresentation==='box' && lidAngle>.35
      if(activePresentation==='box') parts.updateReflection(camera)
      renderer.info.reset()
      const renderStarted=performance.now()
      renderer.render(scene,camera)
      renderer.domElement.dataset.renderMs=(performance.now()-renderStarted).toFixed(2)
      renderer.domElement.dataset.drawCalls=String(renderer.info.render.calls)
      renderer.domElement.dataset.triangles=String(renderer.info.render.triangles)
      renderer.domElement.dataset.lidAngle=lidAngle.toFixed(5)
      renderer.domElement.dataset.rotation=activePresentation==='pedestal' ? '0.00000' : parts.couple.rotation.y.toFixed(5)
      renderer.domElement.dataset.progress=progress.toFixed(5)
      renderer.domElement.dataset.presentation=activePresentation
      if (activePresentation==='box' && progress===goal && settled!==requestedOpen) {
        settled=requestedOpen
        callbacks.current.onSettled(requestedOpen)
      }
      if(pendingPresentation) {
        const completedPresentation=pendingPresentation
        pendingPresentation=null
        callbacks.current.onPresentationReady?.(completedPresentation)
      }
      if (progress!==goal || (activePresentation==='box' && requestedOpen && !motion.matches) || angularVelocity>.001) {
        frame=requestAnimationFrame(draw)
      }
    }
    const resume = () => {
      if (!ready || cancelled || document.hidden || frame) return
      previous=0
      frame=requestAnimationFrame(draw)
    }
    const resize = () => {
      const { width,height }=container.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width,height,false)
      const vertical=4.3*height/width
      camera.aspect=width/height
      camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(vertical/(2*cameraDistance)))
      camera.updateProjectionMatrix()
      camera.updateMatrixWorld(true)
      resume()
    }
    const configureCamera=(value: Presentation) => {
      if(value==='pedestal') {
        camera.position.set(0,5.85,9.4)
        cameraDistance=Math.hypot(3.5,9.4)
      } else {
        camera.position.set(0,7.85,8.8)
        cameraDistance=Math.hypot(5.5,8.8)
      }
      camera.lookAt(0,2.35,0)
      resize()
    }
    controller.current={
      setOpen(value) { requestedOpen=value; settled=null; resume() },
      setPresentation(value) {
        if(activePresentation===value) return
        activePresentation=value
        if(value==='pedestal') angularVelocity=0
        pendingPresentation=value
        parts?.setPresentation(value)
        if(value==='box') {
          progress=0
          requestedOpen=false
          angularVelocity=0
          settled=null
          if(parts) parts.couple.rotation.y=0
        }
        configureCamera(value)
        resume()
      },
    }
    const observer=new ResizeObserver(resize)
    observer.observe(container)
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame=0; previous=0 }
      else resume()
    }
    document.addEventListener('visibilitychange',visibility)
    motion.addEventListener('change',resume)
    const contextLost = (event: Event) => { event.preventDefault(); callbacks.current.onError() }
    renderer.domElement.addEventListener('webglcontextlost',contextLost)

    const disposeObject = (object: THREE.Object3D) => {
      const geometries=new Set<THREE.BufferGeometry>()
      const materials=new Set<THREE.Material>()
      object.traverse(child => {
        if (child instanceof THREE.Sprite) { materials.add(child.material); return }
        if (!(child instanceof THREE.Mesh)) return
        geometries.add(child.geometry)
        for (const material of Array.isArray(child.material) ? child.material : [child.material]) materials.add(material)
      })
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(material => material.dispose())
    }
    createMusicBox(renderer).then(async result => {
      if (cancelled) {
        result.textures.forEach(texture => texture.dispose())
        disposeObject(result.model)
        return
      }
      parts=result
      scene.add(parts.model)
      resize()
      // Prepare clipping and reflection before accepting the first click.
      parts.turntable.visible=true
      parts.mirror.visible=true
      parts.hinge.rotation.x=-Math.PI*.565
      parts.turntable.position.y=.93
      parts.updateReflection(camera)
      await renderer.compileAsync(scene,camera)
      if (cancelled) return
      // Calibrate the small canvas once before the interaction, never mid-animation.
      // The static room stays at full resolution regardless of this render budget.
      const context=renderer.getContext()
      renderer.render(scene,camera)
      context.finish()
      for (;;) {
        const started=performance.now()
        renderer.render(scene,camera)
        context.finish()
        const elapsed=performance.now()-started
        const ratio=renderer.getPixelRatio()
        if (elapsed<=18 || ratio<=.75) break
        renderer.setPixelRatio(Math.max(.75,ratio*.8))
      }
      // Warm the real framebuffer/MSAA/stencil paths, not a different offscreen target.
      for (const stage of [0,.08,.3,.55,.8,1]) {
        parts.hinge.rotation.x=-smooth(stage)*Math.PI*.565
        parts.turntable.position.y=THREE.MathUtils.lerp(-.55,.93,smooth((stage-.24)/.63))
        parts.turntable.visible=stage>0
        parts.mirror.visible=smooth(stage)*Math.PI*.565>.35
        parts.updateReflection(camera)
        renderer.render(scene,camera)
        context.finish()
      }
      // Warm the next scene now, using the same renderer and the same figurines.
      parts.setPresentation('pedestal')
      configureCamera('pedestal')
      await renderer.compileAsync(scene,camera)
      if(cancelled) return
      renderer.render(scene,camera)
      context.finish()
      parts.setPresentation(activePresentation)
      configureCamera(activePresentation)
      parts.hinge.rotation.x=0
      parts.turntable.position.y=-.55
      parts.turntable.visible=false
      parts.mirror.visible=false
      parts.updateReflection(camera)
      renderer.render(scene,camera)
      context.finish()
      container.style.visibility='visible'
      renderer.domElement.dataset.pixelRatio=String(renderer.getPixelRatio())
      ready=true
      pendingPresentation=activePresentation
      resize()
      callbacks.current.onReady()
    }).catch(() => { if (!cancelled) callbacks.current.onError() })

    return () => {
      cancelled=true
      controller.current=null
      cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange',visibility)
      motion.removeEventListener('change',resume)
      renderer.domElement.removeEventListener('webglcontextlost',contextLost)
      parts?.textures.forEach(texture => texture.dispose())
      disposeObject(scene)
      renderer.dispose()
      renderer.domElement.remove()
    }
  },[])

  return <div className="casket__webgl" ref={host} role="img" aria-label={presentation==='pedestal' ? 'عروسان بوضعية رقص ثابتة فوق قاعدة وردية بيضاوية مزخرفة بالذهب' : open ? 'صندوق موسيقى مفتوح بمرآة وعروسين يدوران' : 'صندوق وردي مزخرف بالذهب'} />
}
