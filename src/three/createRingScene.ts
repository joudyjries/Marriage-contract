import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { hullPlanes } from './hullPlanes'
import { MAX_PLANES, stoneFragment, stoneVertex } from './hullDiamond'
import { referenceRing } from './referenceRing'
import { ringIntroAt, settleDuration, turnDuration } from './ringIntro'

// Bright softboxes separated by dark studio walls produce distinct diamond facets.
function studioEnvironment() {
  const width = 512
  const height = 256
  const pixels = new Float32Array(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width
      const v = y / height
      let light = .08 + Math.max(0, Math.sin(v * Math.PI)) * .27
      for (const [cx, cy, w, h, intensity] of [
        [.14, .57, .06, .28, 5.5], [.43, .67, .12, .14, 3.5],
        [.70, .49, .055, .32, 7], [.90, .32, .10, .14, 2.7],
      ]) {
        const distance = Math.max(Math.abs(u - cx) / w, Math.abs(v - cy) / h)
        light += intensity * (1 - THREE.MathUtils.smoothstep(distance, .9, 1.12))
      }
      const offset = (y * width + x) * 4
      pixels[offset] = light
      pixels[offset + 1] = light * .96
      pixels[offset + 2] = light * .99
      pixels[offset + 3] = 1
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.FloatType)
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.minFilter = texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

export function createRingScene(host: HTMLDivElement, isSpinning: () => boolean) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setClearColor(0, 0)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = .95
  renderer.domElement.setAttribute('aria-hidden', 'true')
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  // An orthographic camera keeps the scale constant throughout the turn.
  const camera = new THREE.OrthographicCamera(-3.3, 3.3, 2.15, -2.15, .1, 30)
  camera.position.set(0, 2.6, 6)
  camera.lookAt(0, -.24, 0)
  const environment = studioEnvironment()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const filteredEnvironment = pmrem.fromEquirectangular(environment)
  pmrem.dispose()
  scene.environment = filteredEnvironment.texture

  const key = new THREE.DirectionalLight(0xfff3fb, 1.3)
  key.position.set(-3, 4, 5)
  const rim = new THREE.DirectionalLight(0xe7e6ff, .8)
  rim.position.set(3, 3, -4)
  scene.add(key, rim, new THREE.HemisphereLight(0xffffff, 0x4e1934, .4))
  const silver = new THREE.MeshStandardMaterial({ color: '#e9dce6', metalness: 1, roughness: .13, envMapIntensity: 1.1 })
  const reflectionMaterial = new THREE.MeshStandardMaterial({
    color: '#b294a7', metalness: .85, roughness: .26, transparent: true,
    opacity: .2, depthWrite: false, envMapIntensity: .7,
  })
  const reflectionDiamond = new THREE.MeshStandardMaterial({
    color: '#e6d5e3', metalness: .6, roughness: .16, transparent: true,
    opacity: .15, depthWrite: false, envMapIntensity: 1.1,
  })
  const materials = new Set<THREE.Material>([silver, reflectionMaterial, reflectionDiamond])
  const geometries = new Set<THREE.BufferGeometry>()
  const diamondMaterials = new Map<THREE.BufferGeometry, THREE.ShaderMaterial>()
  const inverse = new THREE.Matrix4()

  function shadeDiamond(mesh: THREE.Mesh) {
    let material = diamondMaterials.get(mesh.geometry)
    if (!material) {
      const position = mesh.geometry.getAttribute('position')
      const points = Array.from({ length: position.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(position, i))
      const planes = hullPlanes(points)
      material = new THREE.ShaderMaterial({
        vertexShader: stoneVertex,
        fragmentShader: stoneFragment,
        uniforms: {
          uEnvironment: { value: environment },
          uLocalCam: { value: new THREE.Vector3() },
          uEnvRot: { value: new THREE.Matrix3() },
          uIor: { value: 2.42 },
          uDispersion: { value: .45 },
          uExposure: { value: 1.45 },
          uContrast: { value: 1.3 },
          uHighlight: { value: .1 },
          uPlaneCount: { value: planes.count },
          uPlanes: { value: new Float32Array(MAX_PLANES * 4) },
        },
      })
      material.uniforms.uPlanes.value.set(planes.data)
      diamondMaterials.set(mesh.geometry, material)
      materials.add(material)
    }
    mesh.material = material
    const stone = material
    mesh.onBeforeRender = () => {
      inverse.copy(mesh.matrixWorld).invert()
      stone.uniforms.uLocalCam.value.copy(camera.position).applyMatrix4(inverse)
      const elements = stone.uniforms.uEnvRot.value.setFromMatrix4(mesh.matrixWorld).elements
      for (let i = 0; i < 9; i += 3) {
        const length = Math.hypot(elements[i], elements[i + 1], elements[i + 2]) || 1
        elements[i] /= length
        elements[i + 1] /= length
        elements[i + 2] /= length
      }
      stone.uniformsNeedUpdate = true
    }
  }

  const turntable = new THREE.Group()
  const reflectionTurntable = new THREE.Group()
  const mirror = new THREE.Group()
  mirror.scale.y = -1
  mirror.add(reflectionTurntable)
  scene.add(turntable, mirror)
  let disposed = false
  let ready = false
  let dirty = true
  let elapsed = 0
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const fail = () => { delete host.dataset.ready }

  new GLTFLoader().load('/models/diamond-ring.glb', gltf => {
    if (disposed) {
      gltf.scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const current = Array.isArray(object.material) ? object.material : [object.material]
          current.forEach(material => material.dispose())
        }
      })
      return
    }
    const originalMaterials = new Set<THREE.Material>()
    let cut: THREE.BufferGeometry | undefined
    gltf.scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      const old = object.material as THREE.Material
      originalMaterials.add(old)
      geometries.add(object.geometry)
      if (object.name === 'CenterDiamond') cut = object.geometry
    })
    originalMaterials.forEach(material => material.dispose())
    if (!cut) {
      fail()
      return
    }
    const model = referenceRing(cut, silver, shadeDiamond, geometries)
    // Lay the band on the turntable: its circular footprint stays broad at every angle.
    model.rotation.set(-Math.PI / 2, 0, -Math.PI / 2)
    turntable.add(model)
    turntable.updateMatrixWorld(true)
    const floorY = new THREE.Box3().setFromObject(model).min.y - .012
    mirror.position.y = floorY * 2
    const reflected = model.clone(true)
    reflected.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return
      object.material = object.userData.diamond ? reflectionDiamond : reflectionMaterial
      object.onBeforeRender = () => {}
    })
    reflectionTurntable.add(reflected)
    ready = true
    dirty = true
  }, undefined, fail)

  const resize = new ResizeObserver(() => {
    const width = host.clientWidth
    const height = host.clientHeight
    if (!width || !height) return
    renderer.setSize(width, height, false)
    const halfWidth = 2.15 * width / height
    camera.left = -halfWidth
    camera.right = halfWidth
    camera.updateProjectionMatrix()
    dirty = true
  })
  resize.observe(host)
  let onScreen = true
  const intersection = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting })
  intersection.observe(host)
  const motionChange = () => { dirty = true }
  reducedMotion.addEventListener('change', motionChange)
  const lost = (event: Event) => { event.preventDefault(); fail() }
  renderer.domElement.addEventListener('webglcontextlost', lost)
  let frame = 0
  let previousTime = 0
  let lastRender = 0
  const render = (time: number) => {
    if (disposed) return
    frame = requestAnimationFrame(render)
    const delta = previousTime ? Math.min(time - previousTime, 80) : 0
    previousTime = time
    if (!ready || !onScreen || document.hidden) return
    const moving = isSpinning() && !reducedMotion.matches && elapsed < turnDuration + settleDuration
    if (moving) {
      elapsed = Math.min(elapsed + delta, turnDuration + settleDuration)
      dirty = true
    }
    if ((moving || dirty) && time - lastRender >= 1000 / 30) {
      const intro = ringIntroAt(reducedMotion.matches ? 0 : elapsed)
      turntable.rotation.y = intro.angle
      reflectionTurntable.rotation.y = intro.angle
      host.style.setProperty('--ring-scale', intro.scale.toFixed(4))
      host.style.setProperty('--ring-drop', `${intro.drop.toFixed(3)}%`)
      host.style.setProperty('--ring-opacity', intro.opacity.toFixed(4))
      renderer.render(scene, camera)
      host.dataset.ready = 'true'
      host.dataset.angle = intro.angle.toFixed(4)
      host.dataset.phase = intro.phase
      host.dataset.elapsed = elapsed.toFixed(0)
      dirty = false
      lastRender = time
    }
  }
  frame = requestAnimationFrame(render)

  return () => {
    disposed = true
    cancelAnimationFrame(frame)
    resize.disconnect()
    intersection.disconnect()
    reducedMotion.removeEventListener('change', motionChange)
    renderer.domElement.removeEventListener('webglcontextlost', lost)
    geometries.forEach(geometry => geometry.dispose())
    materials.forEach(material => material.dispose())
    environment.dispose()
    filteredEnvironment.dispose()
    renderer.dispose()
    renderer.domElement.remove()
    delete host.dataset.ready
    delete host.dataset.angle
    delete host.dataset.phase
    delete host.dataset.elapsed
    host.style.removeProperty('--ring-scale')
    host.style.removeProperty('--ring-drop')
    host.style.removeProperty('--ring-opacity')
  }
}
