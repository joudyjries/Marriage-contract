import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { decodePng, encodePng } from './png-io.mjs'

const directory = '.preview/original-ring'
const vivid = process.argv.includes('--vivid')
const packedDirectory = vivid ? 'packed-vivid' : 'packed'
await mkdir(`${directory}/${packedDirectory}`, { recursive: true })
const count = 106, width = 260, height = 178, wine = [59, 16, 36]
const frames = []
const neighbours = [-1, 0, 1].flatMap(y => [-1, 0, 1].map(x => [x, y]))

function morph(mask, dilate) {
  const result = new Uint8Array(mask.length)
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    let value = dilate ? 0 : 1
    for (const [dx, dy] of neighbours) {
      const sample = mask[(y + dy) * width + x + dx]
      value = dilate ? Math.max(value, sample) : Math.min(value, sample)
    }
    result[y * width + x] = value
  }
  return result
}

function cleanComponents(mask, target, limit) {
  const visited = new Uint8Array(mask.length), queue = new Int32Array(mask.length)
  for (let seed = 0; seed < mask.length; seed++) {
    if (visited[seed] || mask[seed] !== target) continue
    let first = 0, last = 1, edge = false
    queue[0] = seed; visited[seed] = 1
    while (first < last) {
      const p = queue[first++], x = p % width, y = Math.floor(p / width)
      if (!x || !y || x === width - 1 || y === height - 1) edge = true
      for (const [dx, dy] of neighbours) {
        const xx = x + dx, yy = y + dy
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue
        const next = yy * width + xx
        if (!visited[next] && mask[next] === target) { visited[next] = 1; queue[last++] = next }
      }
    }
    if (last <= limit && (target === 1 || !edge)) for (let i = 0; i < last; i++) mask[queue[i]] = 1 - target
  }
}

for (let frame = 1; frame <= count; frame++) {
  const png = decodePng(await readFile(`${directory}/native/frame-${String(frame).padStart(4, '0')}.png`))
  const { pixels, channels } = png
  const corners = [[2, 2], [width - 9, 2], [2, height - 9], [width - 9, height - 9]].map(([cx, cy]) => {
    const color = [0, 0, 0]
    for (let y = cy; y < cy + 7; y++) for (let x = cx; x < cx + 7; x++) for (let k = 0; k < 3; k++) color[k] += pixels[(y * width + x) * channels + k] / 49
    return color
  })
  let mask = new Uint8Array(width * height)
  const score = new Float32Array(width * height), backgrounds = new Float32Array(width * height * 3)
  let left = width, right = 0
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const index = y * width + x, u = x / (width - 1), v = y / (height - 1)
    for (let k = 0; k < 3; k++) {
      const bg = (corners[0][k] * (1 - u) + corners[1][k] * u) * (1 - v) + (corners[2][k] * (1 - u) + corners[3][k] * u) * v
      backgrounds[index * 3 + k] = bg
      score[index] = Math.max(score[index], pixels[index * channels + k] - bg)
    }
    mask[index] = score[index] > 7 ? 1 : 0
    if (y < 128 && score[index] > 45) { left = Math.min(left, x); right = Math.max(right, x) }
  }
  const bright = []
  for (let y = 0; y < 120; y++) for (let x = 10; x < width - 10; x++) {
    const value = score[y * width + x]
    if (value > 35) bright.push(value)
  }
  bright.sort((a, b) => a - b)
  const peak = bright[Math.floor(bright.length * .98)] || 100
  const whiteThreshold = bright[Math.floor(bright.length * .90)] || 100
  const white = [0, 0, 0]; let whiteCount = 0
  for (let y = 0; y < 120; y++) for (let x = 10; x < width - 10; x++) {
    const index = y * width + x
    if (score[index] < whiteThreshold) continue
    whiteCount++
    for (let k = 0; k < 3; k++) white[k] += Math.max(0, pixels[index * channels + k] - backgrounds[index * 3 + k])
  }
  const meanWhite = white.reduce((sum, value) => sum + value, 0) / 3
  const balance = white.map(value => Math.max(.85, Math.min(1.18, meanWhite / Math.max(value, whiteCount))))
  // Closing/filling changes only the matte; photographed facets retain their shape.
  mask = morph(morph(mask, true), false)
  cleanComponents(mask, 1, 10)
  cleanComponents(mask, 0, 45)
  const rgba = Buffer.alloc(width * height * 4)
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const index = y * width + x
    let sum = mask[index] * 8
    for (const [dx, dy] of neighbours) sum += mask[(y + dy) * width + x + dx]
    let alpha = sum / 17
    if (y > height - 10) { const t = (height - 1 - y) / 9; alpha *= t * t * (3 - 2 * t) }
    for (let k = 0; k < 3; k++) {
      const seam = Math.max(0, 1 - score[index] / 20)
      rgba[index * 4 + k] = Math.max(0, Math.min(255, pixels[index * channels + k] + (wine[k] - backgrounds[index * 3 + k]) * seam))
    }
    rgba[index * 4 + 3] = Math.round(alpha * 255)
  }
  frames.push({ rgba, center: (left + right) / 2, extent: right - left + 1, peak, balance, background: corners[0] })
}

for (let frame = 0; frame < count; frame++) {
  let extent = 0, samples = 0
  for (let i = Math.max(0, frame - 3); i <= Math.min(count - 1, frame + 3); i++) { extent += frames[i].extent; samples++ }
  const scale = 216 / (extent / samples), source = frames[frame]
  let peak = 0, gradeSamples = 0
  const balance = [0, 0, 0]
  for (let i = Math.max(0, frame - 5); i <= Math.min(count - 1, frame + 5); i++) {
    peak += frames[i].peak; gradeSamples++
    for (let k = 0; k < 3; k++) balance[k] += frames[i].balance[k]
  }
  const exposure = Math.max(1.4, Math.min(3.2, 235 / (peak / gradeSamples)))
  for (let k = 0; k < 3; k++) balance[k] /= gradeSamples
  const result = Buffer.alloc(width * height * 4), packed = Buffer.alloc(width * 2 * height * 3)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const xx = (x + .5 - width / 2) / scale + source.center - .5
    const yy = (y + .5 - 68) / scale + 68 - .5
    const ix = Math.floor(xx), iy = Math.floor(yy), fx = xx - ix, fy = yy - iy
    const color = [0, 0, 0]; let alpha = 0
    for (let dy = 0; dy <= 1; dy++) for (let dx = 0; dx <= 1; dx++) {
      const sx = ix + dx, sy = iy + dy
      if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue
      const weight = (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy), p = (sy * width + sx) * 4
      const a = source.rgba[p + 3] / 255
      alpha += a * weight
      for (let k = 0; k < 3; k++) color[k] += source.rgba[p + k] * a * weight
    }
    const p = (y * width + x) * 4, rgb = (y * width * 2 + x) * 3, matte = rgb + width * 3
    result[p + 3] = Math.round(alpha * 255)
    const original = color.map(value => alpha ? value / alpha : 0)
    const signal = original.map((value, k) => Math.max(0, value - source.background[k]))
    const strength = Math.max(...signal), t = Math.max(0, Math.min(1, (strength - 18) / 37))
    const coverage = t * t * (3 - 2 * t)
    const corrected = signal.map((value, k) => {
      let linear = value * exposure * balance[k] / 255
      if (linear > .84) linear = .84 + .16 * (1 - Math.exp(-(linear - .84) / .16))
      return Math.pow(Math.max(0, Math.min(1, linear)), .95) * 255
    })
    const neutral = corrected[0] * .2126 + corrected[1] * .7152 + corrected[2] * .0722
    for (let k = 0; k < 3; k++) {
      let value = original[k]
      if (vivid && alpha > 0) {
        const silver = neutral + (corrected[k] - neutral) * .30
        value += (silver - value) * coverage
      }
      result[p + k] = Math.round(value)
      packed[rgb + k] = Math.round(value * alpha + wine[k] * (1 - alpha))
      packed[matte + k] = Math.round(alpha * 255)
    }
  }
  const name = String(frame + 1).padStart(4, '0')
  await writeFile(`${directory}/${packedDirectory}/frame-${name}.png`, encodePng(width * 2, height, packed, 3))
  if (frame === 0) await writeFile(`public/images/ring-recorded-${vivid ? 'vivid' : 'poster'}.png`, encodePng(width, height, result))
  if ([0, 45, 105].includes(frame)) await writeFile(`${directory}/${vivid ? 'vivid' : 'cutout'}-${name}.png`, encodePng(width, height, result))
}
const metadata = { source: 'Screen Recording 2026-11-05 131243.mp4', sourceWidth: 842, sourceHeight: 1080, crop: { x: 290, y: 408, width, height }, frameCount: count, fps: 30, duration: count / 30, completeTurn: false, note: 'Only the clean original camera angles are used. Text covers the ring after this segment. No generated views or reversed frames.' }
if (vivid) metadata.colourCorrection = 'Smoothed highlight exposure, burgundy spill removal and silver white balance; matte, geometry, frame count and motion unchanged.'
await writeFile(`${directory}/${vivid ? 'metadata-vivid' : 'metadata'}.json`, JSON.stringify(metadata, null, 2) + '\n')
console.log(JSON.stringify(metadata))
