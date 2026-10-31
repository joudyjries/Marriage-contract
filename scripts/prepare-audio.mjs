import { readFileSync, writeFileSync } from 'node:fs'

const original = readFileSync(new URL('../public/audio/intro.wav', import.meta.url))
let format, samples
for (let offset = 12; offset + 8 <= original.length;) {
  const name = original.toString('ascii', offset, offset + 4)
  const size = original.readUInt32LE(offset + 4)
  if (name === 'fmt ') format = original.subarray(offset + 8, offset + 8 + size)
  if (name === 'data') samples = original.subarray(offset + 8, offset + 8 + size)
  offset += 8 + size + size % 2
}
if (!format || !samples || format.readUInt16LE(0) !== 1 || format.readUInt16LE(14) !== 16) {
  throw new Error('Expected 16-bit PCM intro WAV')
}
const bytesPerSecond = format.readUInt32LE(8)
const delaySeconds = 5
const introSeconds = 5
const data = Buffer.alloc(bytesPerSecond * (delaySeconds + introSeconds))
samples.copy(data, bytesPerSecond * delaySeconds, 0, Math.min(samples.length, bytesPerSecond * introSeconds))
const header = Buffer.alloc(44)
header.write('RIFF', 0)
header.writeUInt32LE(data.length + 36, 4)
header.write('WAVEfmt ', 8)
header.writeUInt32LE(16, 16)
format.copy(header, 20, 0, 16)
header.write('data', 36)
header.writeUInt32LE(data.length, 40)
writeFileSync(new URL('../public/audio/intro-delayed.wav', import.meta.url), Buffer.concat([header, data]))
console.log('Prepared intro: 5 seconds of silence + 5 seconds of music')
