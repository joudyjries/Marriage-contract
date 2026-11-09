import {writeFile} from 'node:fs/promises'
import * as THREE from 'three'
import {referenceRing} from '../src/three/referenceRing.ts'
import {brilliantCut} from '../src/three/brilliantCut.ts'
const cut=brilliantCut()
const silver=new THREE.MeshStandardMaterial()
const geometrySet=new Set()
const model=referenceRing(cut,silver,mesh=>{mesh.userData.diamond=true},geometrySet)
model.rotation.set(-Math.PI/2,0,-Math.PI/2)
model.updateMatrixWorld(true)
const geometries=[],meshes=[],ids=new Map()
model.traverse(object=>{
 if(!object.isMesh)return
 let geometryIndex=ids.get(object.geometry)
 if(geometryIndex===undefined){
 geometryIndex=geometries.length;ids.set(object.geometry,geometryIndex)
 geometries.push({type:object.geometry.type,positions:Array.from(object.geometry.getAttribute('position').array),indices:object.geometry.index?Array.from(object.geometry.index.array):null})
 }
 meshes.push({geometry:geometryIndex,diamond:!!object.userData.diamond,matrix:object.matrixWorld.toArray()})
})
const bounds=new THREE.Box3().setFromObject(model)
await writeFile('.preview/ring-geometry.json',JSON.stringify({geometries,meshes,floor:bounds.min.y,version:1}))
console.log(JSON.stringify({meshes:meshes.length,geometries:geometries.length,floor:bounds.min.y}))
