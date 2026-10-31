import * as THREE from 'three'

/** A reference-pose cutout for the fixed, camera-facing second scene. */
export function createStaticWeddingFigure(texture: THREE.Texture) {
  const image=texture.image as HTMLImageElement
  const canvas=document.createElement('canvas')
  canvas.width=image.width
  canvas.height=image.height
  const context=canvas.getContext('2d',{willReadFrequently:true})!
  context.drawImage(image,0,0)
  const pixels=context.getImageData(0,0,image.width,image.height).data
  let minX=image.width,minY=image.height,maxX=-1,maxY=-1
  for(let y=0;y<image.height;y++) for(let x=0;x<image.width;x++) {
    if(pixels[(y*image.width+x)*4+3]<32) continue
    minX=Math.min(minX,x);maxX=Math.max(maxX,x)
    minY=Math.min(minY,y);maxY=Math.max(maxY,y)
  }
  if(maxX<minX) throw new Error('Wedding figure has no visible content')
  // Crop transparent padding through UVs, so the actual feet rest on the pedestal.
  texture.repeat.set((maxX-minX+1)/image.width,(maxY-minY+1)/image.height)
  texture.offset.set(minX/image.width,1-(maxY+1)/image.height)
  texture.needsUpdate=true
  const height=3.15
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.01,depthWrite:false,toneMapped:false}))
  sprite.center.set(.5,0)
  sprite.scale.set(height*(maxX-minX+1)/(maxY-minY+1),height,1)
  sprite.position.y=.01
  return sprite
}
