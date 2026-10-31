import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

/** Detailed CC0 sculpture, cropped, painted and optimized offline for this invitation. */
export async function createWeddingFigurines() {
  const { scene } = await new GLTFLoader().loadAsync('/models/wedding-couple.glb')
  const couple = new THREE.Group()
  const porcelain = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    vertexColors: true,
    specular: 0x57504c,
    shininess: 24,
  })
  const replaced = new Set<THREE.Material>()
  scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) replaced.add(material)
    object.material = porcelain
    object.castShadow = false
    object.receiveShadow = false
  })
  replaced.forEach(material => material.dispose())
  couple.add(scene)
  return couple
}
