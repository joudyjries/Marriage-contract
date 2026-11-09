import * as THREE from 'three'

/** Angular four-corner cathedral setting and continuous pavé shank from the reference. */
export function referenceRing(
  cut: THREE.BufferGeometry,
  silver: THREE.Material,
  shadeDiamond: (mesh: THREE.Mesh) => void,
  geometries: Set<THREE.BufferGeometry>,
) {
  const model = new THREE.Group()
  const up = new THREE.Vector3(0, 1, 0)
  const metal = (geometry: THREE.BufferGeometry) => {
    geometries.add(geometry)
    const mesh = new THREE.Mesh(geometry, silver)
    model.add(mesh)
    return mesh
  }
  const stone = (position: THREE.Vector3, scale: number, normal = up) => {
    const mesh = new THREE.Mesh(cut)
    mesh.position.copy(position)
    mesh.scale.setScalar(scale)
    mesh.quaternion.setFromUnitVectors(up, normal.clone().normalize())
    mesh.userData.diamond = true
    shadeDiamond(mesh)
    model.add(mesh)
    return mesh
  }
  const curve = (points: THREE.Vector3[]) => new THREE.CatmullRomCurve3(points, false, 'centripetal')
  const ribbon = (path: THREE.CatmullRomCurve3, outward: THREE.Vector3, width: number, depth: number) => {
    const vertices: number[] = [], indices: number[] = [], steps = 32
    for (let i = 0; i <= steps; i++) {
      const point = path.getPoint(i / steps), tangent = path.getTangent(i / steps)
      const normal = outward.clone().addScaledVector(tangent, -outward.dot(tangent)).normalize()
      const across = tangent.clone().cross(normal).normalize()
      for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        vertices.push(...point.clone().addScaledVector(across, a * width / 2).addScaledVector(normal, b * depth / 2).toArray())
      }
      if (i < steps) for (let side = 0; side < 4; side++) {
        const a = i * 4 + side, b = i * 4 + (side + 1) % 4
        indices.push(a, a + 4, b, b, a + 4, b + 4)
      }
    }
    indices.push(0, 1, 2, 0, 2, 3, steps * 4, steps * 4 + 2, steps * 4 + 1, steps * 4, steps * 4 + 3, steps * 4 + 2)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    metal(geometry)
    return (t: number) => {
      const tangent = path.getTangent(t)
      const normal = outward.clone().addScaledVector(tangent, -outward.dot(tangent)).normalize()
      return { position: path.getPoint(t).addScaledVector(normal, depth / 2), normal }
    }
  }
  const beadGeometry = new THREE.SphereGeometry(.015, 10, 8)
  geometries.add(beadGeometry)
  const bead = (position: THREE.Vector3) => {
    const mesh = new THREE.Mesh(beadGeometry, silver)
    mesh.position.copy(position)
    model.add(mesh)
  }

  const section = [
    [.985, -.067], [1.005, -.087], [1.075, -.087], [1.105, -.06],
    [1.105, .06], [1.075, .087], [1.005, .087], [.985, .067], [.985, -.067],
  ].map(([radius, axial]) => new THREE.Vector2(radius, axial))
  const shoulderOpening = THREE.MathUtils.degToRad(26)
  const bandArc = Math.PI * 2 - shoulderOpening * 2
  const band = metal(new THREE.LatheGeometry(section, 160, Math.PI + shoulderOpening, bandArc))
  band.rotation.x = Math.PI / 2
  for (const z of [-.074, .074]) {
    const edge = metal(new THREE.TorusGeometry(1.104, .010, 8, 160, bandArc))
    edge.position.z = z
    edge.rotation.z = Math.PI / 2 + shoulderOpening
  }
  for (let degrees = 26; degrees <= 334; degrees += 7.8) {
    const angle = THREE.MathUtils.degToRad(degrees)
    const normal = new THREE.Vector3(Math.sin(angle), Math.cos(angle), 0)
    stone(normal.clone().multiplyScalar(1.105), .080, normal)
    const edge = angle + THREE.MathUtils.degToRad(3.9)
    for (const z of [-.074, .074]) bead(new THREE.Vector3(Math.sin(edge) * 1.137, Math.cos(edge) * 1.137, z))
  }

  stone(new THREE.Vector3(0, 1.255, 0), .43)
  for (const side of [-1, 1]) for (const level of [-1, 1]) {
    // Broad pavé ribbons form the open triangular shoulder seen in the side reference.
    const shoulder = curve([
      new THREE.Vector3(side * .63, .86, level * .060),
      new THREE.Vector3(side * .49, 1.055, level * .17),
      new THREE.Vector3(side * .35, 1.30, level * .265),
      new THREE.Vector3(side * .285, 1.45, level * .285),
    ])
    const shoulderSurface = ribbon(shoulder, new THREE.Vector3(side, 0, 0), .092, .046)
    for (let i = 0; i < 12; i++) {
      const { position, normal } = shoulderSurface(.10 + i / 11 * .82)
      stone(position, .027, normal)
    }
    // Four substantial corner claws, rather than separate curved wire hooks.
    const corner = curve([
      new THREE.Vector3(side * .25, 1.27, level * .25),
      new THREE.Vector3(side * .28, 1.36, level * .28),
      new THREE.Vector3(side * .30, 1.445, level * .30),
    ])
    const cornerSurface = ribbon(corner, new THREE.Vector3(side, 0, level).normalize(), .085, .050)
    for (let i = 0; i < 3; i++) {
      const { position, normal } = cornerSurface(.18 + i / 2 * .63)
      stone(position, .024, normal)
    }
    const cap = metal(new THREE.BoxGeometry(.075, .075, .075))
    cap.position.set(side * .278, 1.475, level * .278)
    cap.rotation.y = side * level * Math.PI / 4
    cap.userData.cornerCap = true
  }
  const gallery = Array.from({ length: 64 }, (_, i) => {
    const angle = i / 64 * Math.PI * 2
    return new THREE.Vector3(
      .19 * Math.cos(angle),
      1.17,
      .19 * Math.sin(angle),
    )
  })
  const galleryCurve = new THREE.CatmullRomCurve3(gallery, true, 'centripetal')
  metal(new THREE.TubeGeometry(galleryCurve, 96, .012, 8, true))
  return model
}
