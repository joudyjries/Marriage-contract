import { inflateSync, deflateSync } from 'node:zlib'
import assert from 'node:assert/strict'

export function decodePng(buffer) {
  let width, height, channels
  const chunks = []
  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset), kind = buffer.toString('ascii', offset + 4, offset + 8)
    if (kind === 'IHDR') {
      width = buffer.readUInt32BE(offset + 8)
      height = buffer.readUInt32BE(offset + 12)
      assert.equal(buffer[offset + 16], 8)
      assert.equal(buffer[offset + 20], 0)
      channels = buffer[offset + 17] === 6 ? 4 : buffer[offset + 17] === 2 ? 3 : 0
      assert.ok(channels)
    }
    if (kind === 'IDAT') chunks.push(buffer.subarray(offset + 8, offset + 8 + length))
    offset += length + 12
  }
  const raw = inflateSync(Buffer.concat(chunks)), stride = width * channels, pixels = Buffer.alloc(stride * height)
  const paeth = (a, b, c) => {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < stride; x++) {
    const filter = raw[y * (stride + 1)]
    const a = x >= channels ? pixels[y * stride + x - channels] : 0, b = y ? pixels[(y - 1) * stride + x] : 0
    const c = y && x >= channels ? pixels[(y - 1) * stride + x - channels] : 0
    const prediction = filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : filter === 4 ? paeth(a, b, c) : 0
    pixels[y * stride + x] = (raw[y * (stride + 1) + 1 + x] + prediction) & 255
  }
  return { width, height, channels, pixels }
}

export function encodePng(width, height, pixels, channels = 4) {
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
  const header = Buffer.alloc(13), stride = width * channels, rows = Buffer.alloc((stride + 1) * height)
  header.writeUInt32BE(width)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = channels === 4 ? 6 : 2
  for (let y = 0; y < height; y++) pixels.copy(rows, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))])
}
