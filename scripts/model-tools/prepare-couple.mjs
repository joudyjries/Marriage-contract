import {NodeIO} from '@gltf-transform/core'
import {mkdirSync} from 'node:fs'
import {weld,simplify,prune} from '@gltf-transform/functions'
import {MeshoptSimplifier} from 'meshoptimizer'
import * as THREE from 'three'
mkdirSync('.preview/assets-research',{recursive:true})
const io=new NodeIO(),doc=await io.read(process.argv[2] || '.preview/assets-research/couple-original.glb')
const prim=doc.getRoot().listMeshes()[0].listPrimitives()[0],positions=prim.getAttribute('POSITION').getArray(),indices=prim.getIndices().getArray()
const kept=[]
for(let i=0;i<indices.length;i+=3){const y=(positions[indices[i]*3+1]+positions[indices[i+1]*3+1]+positions[indices[i+2]*3+1])/3;if(y>.0702)kept.push(indices[i],indices[i+1],indices[i+2])}
const index=doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(kept)).setBuffer(doc.getRoot().listBuffers()[0])
prim.setIndices(index).setAttribute('NORMAL',null)
await doc.transform(weld(),prune())
function smoothNormals(){const p=prim.getAttribute('POSITION'),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p.getArray(),3));g.setIndex(new THREE.BufferAttribute(prim.getIndices().getArray(),1));g.computeVertexNormals();const n=doc.createAccessor().setType('VEC3').setArray(g.attributes.normal.array).setBuffer(doc.getRoot().listBuffers()[0]);prim.setAttribute('NORMAL',n);g.dispose()}
smoothNormals()
console.log('Cropped triangles',prim.getIndices().getCount()/3,'vertices',prim.getAttribute('POSITION').getCount())
await MeshoptSimplifier.ready
await doc.transform(simplify({simplifier:MeshoptSimplifier,ratio:.18,error:.0015}),prune())
smoothNormals()
await doc.transform(prune())
await io.write('.preview/assets-research/couple-preview.glb',doc)
console.log('Preview triangles',prim.getIndices().getCount()/3,'vertices',prim.getAttribute('POSITION').getCount())

