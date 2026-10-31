import{NodeIO}from'@gltf-transform/core'
import{readFileSync,mkdirSync,statSync}from'node:fs'
import * as THREE from'three'
const io=new NodeIO(),doc=await io.read('.preview/assets-research/couple-preview.glb'),root=doc.getRoot(),primitive=root.listMeshes()[0].listPrimitives()[0]
const pos=primitive.getAttribute('POSITION').getArray(),normal=primitive.getAttribute('NORMAL').getArray(),idx=primitive.getIndices().getArray(),n=pos.length/3
const adjacent=Array.from({length:n},()=>[])
function link(a,b){const dx=pos[a*3]-pos[b*3],dy=pos[a*3+1]-pos[b*3+1],dz=pos[a*3+2]-pos[b*3+2];const dot=normal[a*3]*normal[b*3]+normal[a*3+1]*normal[b*3+1]+normal[a*3+2]*normal[b*3+2];const weight=Math.hypot(dx,dy,dz)*(1+3*(1-dot)**2);adjacent[a].push([b,weight]);adjacent[b].push([a,weight])}
for(let i=0;i<idx.length;i+=3){link(idx[i],idx[i+1]);link(idx[i+1],idx[i+2]);link(idx[i+2],idx[i])}
const named=JSON.parse(readFileSync(new URL('./anatomy-samples.json',import.meta.url))),seeds=[]
for(const[view,points]of Object.entries(named))for(const[name,p]of Object.entries(points)){
 if(!p||name==='groomWrist'||name==='skin_shoulder1'||name==='skin_shoulder2')continue
 let label=name.startsWith('suit_')||name==='groomChest'?0:name.startsWith('dress_')||name==='waist'?1:name.toLowerCase().includes('hair')?3:name.startsWith('shirt_')?4:2
 seeds.push({point:p,label})
}
seeds.push({point:[.005,.91,.068],label:3},{point:[.03,.90,.085],label:3},{point:[.02,.57,-.08],label:0},{point:[-.015,.55,-.06],label:0})
function ellipse(p,c,r){return p.reduce((s,v,k)=>s+((v-c[k])/r[k])**2,0)<1}
function capsule(p,a,b,r){const ab=b.map((v,k)=>v-a[k]),ap=p.map((v,k)=>v-a[k]),t=Math.max(0,Math.min(1,ap.reduce((s,v,k)=>s+v*ab[k],0)/ab.reduce((s,v)=>s+v*v,0)));return p.reduce((s,v,k)=>s+(v-a[k]-t*ab[k])**2,0)<r*r}
const allowed=(label,i)=>{
 const p=[pos[i*3],pos[i*3+1],pos[i*3+2]],[x,y,z]=p
 if(label===0){
   if(y>.55)return x>=0||capsule(p,[.02,.57,-.08],[-.015,.55,-.06],.025)
   if(y>.47)return true
   const extra=y<.17?1.4:1
   return ((x-.125)/(.08*extra))**2+((z-.045)/(.085*extra))**2<1||((x-.09)/(.075*extra))**2+((z+.065)/(.065*extra))**2<1
 }
 if(label===1)return y<.77
 if(label===3)return y>.84||(y>.54&&x<-.065)
 if(label===4)return y>.745&&y<.815&&x>.025&&x<.1&&z>-.025&&z<.09
 if(label===2)return y>.83||(y>.74&&x<.025)||(y>.652&&y<.75&&x<.018)||ellipse(p,[.09,.813,.005],[.042,.023,.055])||capsule(p,[-.06,.689,.08],[-.007,.577,.082],.034)||capsule(p,[-.007,.577,.082],[.032,.636,.083],.027)||capsule(p,[.032,.636,.083],[.068,.715,.085],.027)||ellipse(p,[-.045,.525,.075],[.065,.025,.035])||ellipse(p,[-.057,.507,-.046],[.055,.023,.03])||ellipse(p,[-.078,.507,.015],[.025,.025,.025])
 return false
}
const distances=new Float64Array(n).fill(Infinity),labels=new Int8Array(n).fill(-1),heap=[]
function push(entry){let i=heap.length;heap.push(entry);while(i){let p=(i-1)>>1;if(heap[p][0]<=entry[0])break;heap[i]=heap[p];i=p}heap[i]=entry}
function pop(){const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1][0]<heap[c][0])c++;if(heap[c][0]>=last[0])break;heap[i]=heap[c];i=c}heap[i]=last}return top}
for(const seed of seeds){let vertex=0,best=Infinity;for(let i=0;i<n;i++){const d=(pos[i*3]-seed.point[0])**2+(pos[i*3+1]-seed.point[1])**2+(pos[i*3+2]-seed.point[2])**2;if(d<best&&allowed(seed.label,i)){best=d;vertex=i}}distances[vertex]=0;labels[vertex]=seed.label;push([0,vertex,seed.label])}
while(heap.length){const[d,a,label]=pop();if(d!==distances[a]||labels[a]!==label)continue;for(const[b,w]of adjacent[a]){if(!allowed(label,b))continue;const next=d+w;if(next<distances[b]){distances[b]=next;labels[b]=label;push([next,b,label])}}}
const palette=[0x202027,0xead1df,0xe6bea8,0x35241e,0xf2ebe6].map(hex=>new THREE.Color(hex).toArray())
const colors=new Uint8Array(n*3),counts=[0,0,0,0,0]
for(let i=0;i<n;i++){
 if(labels[i]<0){let best=Infinity;for(const seed of seeds){const d=(pos[i*3]-seed.point[0])**2+(pos[i*3+1]-seed.point[1])**2+(pos[i*3+2]-seed.point[2])**2;if(d<best&&allowed(seed.label,i)){best=d;labels[i]=seed.label}}}
 if(pos[i*3+1]>.90&&pos[i*3]>-.02)labels[i]=3
 if(pos[i*3+1]>.865&&pos[i*3]>.06&&pos[i*3+2]<-.015)labels[i]=3
 if(pos[i*3+1]>.825&&labels[i]!==3)labels[i]=2
 const c=palette[Math.max(0,labels[i])];counts[Math.max(0,labels[i])]++;for(let k=0;k<3;k++)colors[i*3+k]=Math.round(c[k]*255)
}
const buffer=root.listBuffers()[0]
primitive.setAttribute('COLOR_0',doc.createAccessor('Porcelain paint').setType('VEC3').setArray(colors).setNormalized(true).setBuffer(buffer))
primitive.setMaterial(doc.createMaterial('Painted wedding sculpture').setBaseColorFactor([1,1,1,1]).setMetallicFactor(0).setRoughnessFactor(.65))
root.setExtras({source:'https://remeshy.com/model/bride-and-groom-figurine-196413b6-b8a',license:'CC0',modifications:'Removed original base, simplified, smoothed, painted and normalized.'})
await io.write('.preview/assets-research/couple-painted-raw.glb',doc)
const floor=.0702,scale=1.44/(.9703242779-floor)
for(let i=0;i<n;i++){pos[i*3]=(pos[i*3]-.015)*scale;pos[i*3+1]=(pos[i*3+1]-floor)*scale;pos[i*3+2]=(pos[i*3+2]+.015)*scale}
mkdirSync('public/models',{recursive:true})
await io.write('public/models/wedding-couple.glb',doc)
console.log(JSON.stringify({triangles:idx.length/3,vertices:n,bytes:statSync('public/models/wedding-couple.glb').size,paintedVertices:counts}))

