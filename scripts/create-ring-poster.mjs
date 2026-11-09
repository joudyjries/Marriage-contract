import { readFile, writeFile } from 'node:fs/promises'
import { inflateSync, deflateSync } from 'node:zlib'
import assert from 'node:assert/strict'

function decodePng(buffer) {
  let width, height, channels
  const chunks = []
  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset)
    const kind = buffer.toString('ascii', offset + 4, offset + 8)
    if (kind === 'IHDR') {
      width = buffer.readUInt32BE(offset + 8)
      height = buffer.readUInt32BE(offset + 12)
      assert.equal(buffer[offset + 16], 8, 'Expected 8-bit PNG')
      channels = buffer[offset + 17] === 6 ? 4 : buffer[offset + 17] === 2 ? 3 : 0
      assert.ok(channels, 'Expected RGB or RGBA PNG')
      assert.equal(buffer[offset + 20], 0, 'Expected non-interlaced PNG')
    }
    if (kind === 'IDAT') chunks.push(buffer.subarray(offset + 8, offset + 8 + length))
    offset += length + 12
  }
  const raw = inflateSync(Buffer.concat(chunks))
  const stride = width * channels, pixels = Buffer.alloc(stride * height)
  const paeth = (a, b, c) => {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
  }
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? pixels[y * stride + x - channels] : 0
      const b = y ? pixels[(y - 1) * stride + x] : 0
      const c = y && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0
      const prediction = filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : filter === 4 ? paeth(a, b, c) : 0
      pixels[y * stride + x] = (raw[y * (stride + 1) + 1 + x] + prediction) & 255
    }
  }
  return { width, height, channels, pixels }
}

const [colour, mask] = await Promise.all(process.argv.slice(2, 4).map(async file => decodePng(await readFile(file))))
assert.equal(colour.width, mask.width)
assert.equal(colour.height, mask.height)
const { width, height } = colour, stride = width * 4
const rows = Buffer.alloc((stride + 1) * height)
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const index = y * width + x, target = y * (stride + 1) + 1 + x * 4
  for (let channel = 0; channel < 3; channel++) rows[target + channel] = colour.pixels[index * colour.channels + channel]
  const alpha = mask.pixels[index * mask.channels]
  rows[target + 3] = alpha < 4 ? 0 : Math.min(alpha, colour.channels === 4 ? colour.pixels[index * 4 + 3] : 255)
}
const crc32 = buffer => {
  let value = 0xffffffff
  for (const byte of buffer) {
    value ^= byte
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  return (value ^ 0xffffffff) >>> 0
}
const chunk = (kind, data) => {
  const name = Buffer.from(kind), output = Buffer.alloc(data.length + 12)
  output.writeUInt32BE(data.length)
  name.copy(output, 4)
  data.copy(output, 8)
  output.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length)
  return output
}
const header = Buffer.alloc(13)
header.writeUInt32BE(width)
header.writeUInt32BE(height, 4)
header[8] = 8
header[9] = 6
await writeFile(process.argv[4], Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0)),
]))
console.log(JSON.stringify({ width, height, output: process.argv[4] }))
