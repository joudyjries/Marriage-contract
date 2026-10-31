import * as THREE from 'three'

export function createWeddingPedestal(art: THREE.Texture, contactTexture: THREE.Texture) {
  const root=new THREE.Group()
  root.rotation.y=-.12
  const gold=new THREE.MeshPhongMaterial({color:0xcaa269,specular:0xf2d8ab,shininess:65})
  const pink=new THREE.MeshPhongMaterial({color:0xf1d2df,specular:0x9a737f,shininess:30})
  const band=new THREE.MeshBasicMaterial({map:art,alphaTest:.1,toneMapped:false})
  const shape=new THREE.CylinderGeometry(1.85,1.82,.36,80,1,false,Math.PI,Math.PI*2)
  const uv=shape.attributes.uv
  for(let i=0;i<uv.count;i++) {
    uv.setXY(i,.1+.8*uv.getX(i),.15+.24*uv.getY(i))
  }
  const base=new THREE.Mesh(shape,[band,pink,pink])
  base.scale.z=.62
  base.position.y=.23
  root.add(base)
  const top=new THREE.Mesh(new THREE.CylinderGeometry(1.79,1.79,.026,80),pink)
  top.scale.z=.62
  top.position.y=.421
  root.add(top)
  for(const [radius,height,thickness] of [[1.85,.421,.025],[1.82,.057,.018],[1.72,.44,.009]]) {
    const rim=new THREE.Mesh(new THREE.TorusGeometry(radius,thickness,8,80),gold)
    rim.rotation.x=-Math.PI/2
    rim.scale.y=.62
    rim.position.y=height
    root.add(rim)
  }
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(2,1.4),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,opacity:.7}))
  shadow.rotation.x=-Math.PI/2
  shadow.position.y=.444
  root.add(shadow)
  const socket=new THREE.Group()
  socket.position.y=.45
  root.add(socket)
  root.visible=false
  return {root,socket}
}
