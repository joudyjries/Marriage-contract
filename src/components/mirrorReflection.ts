import * as THREE from 'three'

/** A single-pass planar reflection, confined to the mirror by its stencil mask. */
export function createMirrorReflection(model: THREE.Group, mirror: THREE.Mesh, couple: THREE.Group) {
  const reflection = couple.clone(true)
  reflection.matrixAutoUpdate=false
  const materials = new Map<THREE.Material,THREE.Material>()
  const tint=new THREE.Color(0xf0cbd1)
  reflection.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    const original=object.material as THREE.Material & { color: THREE.Color; vertexColors?: boolean }
    let material=materials.get(original)
    if (!material) {
      material=new THREE.MeshBasicMaterial({
        color: original.color.clone().lerp(tint,.2), vertexColors:original.vertexColors===true, transparent:true, opacity:.72,
        depthWrite:false, depthTest:false, stencilWrite:true, stencilWriteMask:0,
        stencilRef:1, stencilFunc:THREE.EqualStencilFunc,
        stencilFail:THREE.KeepStencilOp, stencilZFail:THREE.KeepStencilOp, stencilZPass:THREE.KeepStencilOp,
      })
      materials.set(original,material)
    }
    object.material=material
    object.castShadow=false
    object.receiveShadow=false
    object.renderOrder=11
  })
  model.add(reflection)
  const normal=new THREE.Vector3()
  const point=new THREE.Vector3()
  const direction=new THREE.Vector3()
  const normalMatrix=new THREE.Matrix3()
  const reflected=new THREE.Matrix4()
  const inverseModel=new THREE.Matrix4()

  return (camera: THREE.Camera) => {
    reflection.visible=mirror.visible && couple.parent!.visible
    if (!reflection.visible) return
    model.updateMatrixWorld(true)
    normal.set(0,0,1).applyNormalMatrix(normalMatrix.getNormalMatrix(mirror.matrixWorld))
    point.setFromMatrixPosition(mirror.matrixWorld)
    direction.setFromMatrixPosition(camera.matrixWorld).sub(point)
    if (normal.dot(direction)<=0) { reflection.visible=false; return }
    const {x,y,z}=normal
    const distance=-normal.dot(point)
    reflected.set(
      1-2*x*x,-2*x*y,-2*x*z,-2*distance*x,
      -2*y*x,1-2*y*y,-2*y*z,-2*distance*y,
      -2*z*x,-2*z*y,1-2*z*z,-2*distance*z,
      0,0,0,1,
    )
    inverseModel.copy(model.matrixWorld).invert()
    reflection.matrix.copy(inverseModel).multiply(reflected).multiply(couple.matrixWorld)
    reflection.matrixWorldNeedsUpdate=true
  }
}
