import assert from 'node:assert/strict'
import {readFile,writeFile} from 'node:fs/promises'
const path=process.argv[2],file=await readFile(path)
function boxes(buffer,start,end){const result=[];for(let offset=start;offset+8<=end;){let size=buffer.readUInt32BE(offset),header=8;if(size===1){size=Number(buffer.readBigUInt64BE(offset+8));header=16}if(!size)size=end-offset;assert.ok(size>=header&&offset+size<=end);result.push({type:buffer.toString('ascii',offset+4,offset+8),offset,data:offset+header,end:offset+size,size});offset+=size}return result}
const root=boxes(file,0,file.length),ftyp=root[0],moov=root.find(b=>b.type==='moov'),mdat=root.find(b=>b.type==='mdat')
assert.equal(ftyp.type,'ftyp')
if(moov.offset<mdat.offset){console.log('Already fast-start');process.exit(0)}
assert.ok(root.every(b=>['ftyp','moov','free','wide','mdat'].includes(b.type)))
const header=Buffer.from(file.subarray(moov.offset,moov.end))
const containers=new Set(['moov','trak','mdia','minf','stbl'])
let adjusted=0
function relocate(start,end){for(const box of boxes(header,start,end)){if(containers.has(box.type))relocate(box.data,box.end);else if(box.type==='stco'||box.type==='co64'){const count=header.readUInt32BE(box.data+4);for(let i=0;i<count;i++){const offset=box.data+8+i*(box.type==='stco'?4:8);if(box.type==='stco'){const value=header.readUInt32BE(offset);assert.ok(value<moov.offset);header.writeUInt32BE(value+moov.size,offset)}else{const value=header.readBigUInt64BE(offset);assert.ok(value<BigInt(moov.offset));header.writeBigUInt64BE(value+BigInt(moov.size),offset)}adjusted++}}}}
relocate(0,header.length)
const output=Buffer.concat([file.subarray(ftyp.offset,ftyp.end),header,...root.filter(b=>b!==ftyp&&b!==moov).map(b=>file.subarray(b.offset,b.end))])
assert.equal(output.length,file.length)
assert.ok(adjusted>0)
await writeFile(path,output)
console.log(JSON.stringify({adjustedChunks:adjusted,bytes:output.length,fastStart:true}))
