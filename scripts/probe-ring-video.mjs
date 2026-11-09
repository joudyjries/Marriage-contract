import {readFile,writeFile} from 'node:fs/promises'
const buffer=await readFile(process.argv[2])
function boxes(start,end){const result=[];for(let offset=start;offset+8<=end;){let size=buffer.readUInt32BE(offset),header=8;const type=buffer.toString('ascii',offset+4,offset+8);if(size===1){size=Number(buffer.readBigUInt64BE(offset+8));header=16}if(size===0)size=end-offset;if(size<header||offset+size>end)break;result.push({type,offset,data:offset+header,end:offset+size,size});offset+=size}return result}
const root=boxes(0,buffer.length),movie=root.find(box=>box.type==='moov')
if(!movie)throw new Error('Movie metadata is not finalized')
const tracks=[]
for(const track of boxes(movie.data,movie.end).filter(box=>box.type==='trak')){
const children=boxes(track.data,track.end),tkhd=children.find(box=>box.type==='tkhd'),mdia=children.find(box=>box.type==='mdia'),mdiaChildren=boxes(mdia.data,mdia.end),mdhd=mdiaChildren.find(box=>box.type==='mdhd'),handler=mdiaChildren.find(box=>box.type==='hdlr')
const kind=buffer.toString('ascii',handler.data+8,handler.data+12)
if(kind!=='vide')continue
const timeScale=buffer.readUInt32BE(mdhd.data+12),duration=buffer.readUInt32BE(mdhd.data+16)/timeScale
const minf=mdiaChildren.find(box=>box.type==='minf'),stbl=boxes(minf.data,minf.end).find(box=>box.type==='stbl'),sampleBoxes=boxes(stbl.data,stbl.end),stsz=sampleBoxes.find(box=>box.type==='stsz'),stsd=sampleBoxes.find(box=>box.type==='stsd'),frameCount=buffer.readUInt32BE(stsz.data+8)
tracks.push({kind,codec:buffer.toString('ascii',stsd.data+12,stsd.data+16),width:buffer.readUInt32BE(tkhd.end-8)/65536,height:buffer.readUInt32BE(tkhd.end-4)/65536,duration,frameCount,fps:frameCount/duration})
}
const result={bytes:buffer.length,fastStart:root.findIndex(box=>box.type==='moov')<root.findIndex(box=>box.type==='mdat'),tracks}
console.log(JSON.stringify(result,null,2))
if(process.argv[3])await writeFile(process.argv[3],JSON.stringify(result,null,2)+'\n')
