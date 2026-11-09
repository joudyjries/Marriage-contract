import * as THREE from 'three'

/** Closed 57-facet round brilliant, with an eight-sided table and 75% lower halves. */
export function brilliantCut() {
  const positions: number[] = []
  const center = new THREE.Vector3(0, .17, 0)
  const ring = (radius: number, height: number, count: number, offset = 0) =>
    Array.from({ length: count }, (_, i) => {
      const angle = offset + i * Math.PI * 2 / count
      return new THREE.Vector3(radius * Math.cos(angle), height, radius * Math.sin(angle))
    })
  const face = (vertices: THREE.Vector3[]) => {
    const normal = vertices[1].clone().sub(vertices[0]).cross(vertices[2].clone().sub(vertices[0]))
    const midpoint = vertices.reduce((sum, vertex) => sum.add(vertex), new THREE.Vector3()).divideScalar(vertices.length)
    const ordered = normal.dot(midpoint.sub(center)) < 0 ? [...vertices].reverse() : vertices
    for (let i = 1; i < ordered.length - 1; i++) {
      positions.push(...ordered[0].toArray(), ...ordered[i].toArray(), ...ordered[i + 1].toArray())
    }
  }
  const table = ring(.56, .59, 8)
  const stars = ring(.78, .29 + .3 * (1 - .78 * Math.cos(Math.PI / 8)) / .44, 8, Math.PI / 8)
  const upper = ring(1, .29, 64)
  const lower = ring(1, .27, 64)
  const halves = ring(.26, -.57 + .84 * .26 * Math.cos(Math.PI / 8), 8, Math.PI / 8)
  const culet = new THREE.Vector3(0, -.57, 0)
  face(table)
  for (let i = 0; i < 8; i++) {
    const next = (i + 1) % 8, previous = (i + 7) % 8
    const major = i * 8
    face([table[i], table[next], stars[i]])
    face([table[i], stars[previous], upper[major], stars[i]])
    face([culet, halves[i], lower[major], halves[previous]])
    for (let j = 0; j < 8; j++) {
      const edge = (major + j) % 64, nextEdge = (edge + 1) % 64
      face([stars[i], upper[edge], upper[nextEdge]])
      face([halves[i], lower[edge], lower[nextEdge]])
    }
  }
  for (let i = 0; i < 64; i++) {
    const next = (i + 1) % 64
    face([upper[i], lower[i], lower[next], upper[next]])
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}
