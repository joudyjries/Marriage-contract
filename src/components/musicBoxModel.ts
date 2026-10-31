import * as THREE from 'three'
import { createMirrorReflection } from './mirrorReflection'
import { createWeddingFigurines } from './weddingFigurines'
import { createWeddingPedestal } from './weddingPedestal'
import { createStaticWeddingFigure } from './staticWeddingFigure'

export async function createMusicBox(renderer: THREE.WebGLRenderer) {
  const model = new THREE.Group()
  const loader = new THREE.TextureLoader()
  const [closedArt, openArt, loadedCouple, displayPortrait] = await Promise.all([
    loader.loadAsync('/images/rococo-casket-front.png'),
    loader.loadAsync('/images/rococo-casket-open.png'),
    createWeddingFigurines(),
    loader.loadAsync('/images/wedding-dance-static.png'),
  ])
  for (const texture of [closedArt,openArt,displayPortrait]) {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  }
  const gold = new THREE.MeshPhongMaterial({ color:0xc59c64, specular:0xe8c58e, shininess:70 })
  const pink = new THREE.MeshPhongMaterial({ color:0xe7b7b6, specular:0x775b60, shininess:35 })
  const lining = new THREE.MeshLambertMaterial({ color:0xf1d6e0 })
  const platformVelvet = new THREE.MeshLambertMaterial({ color:0xe2b6c8 })
  const closedMaterial = new THREE.MeshBasicMaterial({ map: closedArt, transparent: true, alphaTest: .1, side: THREE.DoubleSide, toneMapped: false })
  const insideMaterial = new THREE.MeshBasicMaterial({ map: openArt, transparent: true, alphaTest: .1, side: THREE.DoubleSide, toneMapped: false })

  function box(parent: THREE.Object3D, material: THREE.Material, size: number[], position: number[]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size as [number,number,number]),material)
    mesh.position.set(...position as [number,number,number])
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }
  function picture(parent: THREE.Object3D, material: THREE.Material, corners: number[][], uv: number[][]) {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(corners.flat(),3))
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv.map(([u,v]) => [u,1-v]).flat(),2))
    geometry.setIndex([0,1,2,0,2,3])
    geometry.computeVertexNormals()
    const mesh = new THREE.Mesh(geometry,material)
    parent.add(mesh)
    return mesh
  }
  // Four actual walls surround a recessed interior; the front never changes images.
  box(model,pink,[3.65,.85,.10],[0,.6,1.21])
  box(model,pink,[3.65,.85,.10],[0,.6,-1.21])
  for (const x of [-1.78,1.78]) box(model,pink,[.11,.85,2.4],[x,.6,0])
  box(model,lining,[3.48,.06,2.3],[0,.25,0])
  for (const z of [-1.2,1.2]) {
    box(model,gold,[3.7,.055,.065],[0,1.02,z])
    box(model,gold,[3.7,.04,.045],[0,.23,z])
  }
  for (const x of [-1.82,1.82]) box(model,gold,[.05,.055,2.44],[x,1.02,0])
  // Use the existing carved artwork as a textured facade, including its feet.
  picture(model,closedMaterial,[[-1.98,1.07,1.274],[1.98,1.07,1.274],[1.98,-.045,1.274],[-1.98,-.045,1.274]],[[.013,.51],[.987,.51],[.987,.941],[.013,.941]])
  for (const x of [-1.65,1.65]) for (const z of [-1.0,1.0]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(.11,16,12),gold)
    foot.scale.set(1,.85,1.25)
    foot.position.set(x,.12,z)
    model.add(foot)
  }

  // Everything on the lid belongs to this ONE hinge, fixed at the rear rim.
  const hinge = new THREE.Group()
  hinge.position.set(0,1.09,-1.26)
  model.add(hinge)
  box(hinge,gold,[3.82,.12,2.6],[0,0,1.3])
  picture(hinge,closedMaterial,[[-1.91,.066,0],[1.91,.066,0],[1.91,.066,2.6],[-1.91,.066,2.6]],[[.11,.128],[.89,.128],[.953,.486],[.047,.486]])
  picture(hinge,insideMaterial,[[-1.88,-.066,0],[1.88,-.066,0],[1.88,-.066,2.6],[-1.88,-.066,2.6]],[[.105,.493],[.895,.493],[.895,.012],[.105,.012]])
  for (const x of [-1.24,1.24]) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.42,20),gold)
    pin.rotation.z = Math.PI/2
    pin.position.set(x,1.09,-1.26)
    model.add(pin)
  }
  // Reflect the actual moving sculpture, not another offset sprite animation.
  const mirror = new THREE.Mesh(new THREE.CircleGeometry(.83,48),new THREE.MeshBasicMaterial({
    color:0xe3c8cf, stencilWrite:true, stencilRef:1, stencilFunc:THREE.AlwaysStencilFunc,
    stencilZPass:THREE.ReplaceStencilOp,
  }))
  mirror.renderOrder=10
  mirror.rotation.x = Math.PI/2
  mirror.position.set(0,-.073,1.3)
  mirror.scale.y = 1.04
  hinge.add(mirror)

  const turntable = new THREE.Group()
  turntable.position.y = -.55
  turntable.visible = false
  model.add(turntable)
  const platter = new THREE.Mesh(new THREE.CylinderGeometry(1.16,1.16,.045,96),gold)
  platter.scale.z=.65
  turntable.add(platter)
  const velvet = new THREE.Mesh(new THREE.CylinderGeometry(1.125,1.125,.048,96),platformVelvet)
  velvet.scale.z=.65
  velvet.position.y=.006
  turntable.add(velvet)
  const couple = loadedCouple
  couple.position.y=.04
  couple.scale.setScalar(1.06)
  turntable.add(couple)
  const contactCanvas=document.createElement('canvas')
  contactCanvas.width=64
  contactCanvas.height=64
  const context=contactCanvas.getContext('2d')!
  const contactGradient=context.createRadialGradient(32,32,3,32,32,31)
  contactGradient.addColorStop(0,'rgba(61,28,46,.3)')
  contactGradient.addColorStop(1,'rgba(61,28,46,0)')
  context.fillStyle=contactGradient
  context.fillRect(0,0,64,64)
  const contactTexture=new THREE.CanvasTexture(contactCanvas)
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(1.1,.75),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false}))
  contact.rotation.x=-Math.PI/2
  contact.position.y=.033
  turntable.add(contact)
  // The actual tray floor and walls occlude the lift until it clears the rim.
  const floor = box(model,lining,[3.44,.08,2.25],[0,.31,0])
  floor.receiveShadow = true
  // Opening in the tray for the mechanically rising music platform.
  floor.visible = false
  const trayShape = new THREE.Shape()
  trayShape.moveTo(-1.72,-1.12);trayShape.lineTo(1.72,-1.12);trayShape.lineTo(1.72,1.12);trayShape.lineTo(-1.72,1.12);trayShape.closePath()
  const cutout = new THREE.Path()
  cutout.absellipse(0,0,1.16,.992,0,Math.PI*2,true,0)
  trayShape.holes.push(cutout)
  const tray = new THREE.Mesh(new THREE.ShapeGeometry(trayShape,48),lining)
  tray.rotation.x=-Math.PI/2
  tray.position.y=.87
  tray.receiveShadow=true
  model.add(tray)
  const well = new THREE.Mesh(new THREE.CylinderGeometry(1.16,1.16,1.2,64,1,true),new THREE.MeshLambertMaterial({color:0x795261,side:THREE.BackSide}))
  well.scale.z=.992/1.16
  well.position.y=.3
  model.add(well)

  // A fitted oval inlay fills the interior, like the inset music mechanism in the reference.
  for (const [radius,tube] of [[1.2,.024],[1.25,.011]]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius,tube,10,96),gold)
    rim.rotation.x=-Math.PI/2
    rim.scale.y=.855
    rim.position.y=.89
    model.add(rim)
  }
  for (const x of [-1.65,1.65]) box(model,gold,[.018,.022,2.12],[x,.9,0])
  for (const z of [-1.06,1.06]) box(model,gold,[3.3,.022,.018],[0,.9,z])

  // Apply the depth adjustment BEFORE the hinge rotation. Scaling the whole model
  // would stretch the lid as it rises and make the hinge movement look rubbery.
  const body = new THREE.Group()
  for (const child of [...model.children]) {
    if (child !== hinge && child !== turntable) body.add(child)
  }
  body.scale.z=.76
  model.add(body)
  const lidBody = new THREE.Group()
  for (const child of [...hinge.children]) lidBody.add(child)
  lidBody.scale.z=.76
  hinge.position.z*=.76
  hinge.add(lidBody)

  // Conceal the retracted mechanism below the case floor, including between its feet.
  const caseFloor = new THREE.Plane(new THREE.Vector3(0,1,0),-.27)
  turntable.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    const clipMaterial = (source: THREE.Material) => {
      const material = source === gold ? source.clone() : source
      material.clippingPlanes=[caseFloor]
      material.clipShadows=true
      return material
    }
    object.material=Array.isArray(object.material)
      ? object.material.map(clipMaterial)
      : clipMaterial(object.material)
  })

  const updateReflection=createMirrorReflection(model,mirror,couple)
  const boxRoot=new THREE.Group()
  for(const child of [...model.children]) boxRoot.add(child)
  model.add(boxRoot)
  const pedestal=createWeddingPedestal(closedArt,contactTexture)
  pedestal.socket.add(createStaticWeddingFigure(displayPortrait))
  model.add(pedestal.root)
  const setPresentation=(presentation:'box'|'pedestal') => {
    const onPedestal=presentation==='pedestal'
    boxRoot.visible=!onPedestal
    pedestal.root.visible=onPedestal
    if(couple.parent!==turntable) turntable.add(couple)
    couple.position.set(0,.04,0)
    couple.scale.setScalar(1.06)
  }
  return { model, hinge, turntable, couple, mirror, setPresentation, updateReflection, textures: [closedArt,openArt,contactTexture,displayPortrait] }
}
