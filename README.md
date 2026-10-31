# Blush wedding music box

A two-scene wedding invitation built with React, TypeScript and Three.js.

The pink and gold box opens automatically one second after entry, once graphics are ready. After the lid finishes opening, the couple continues rotating inside for three seconds. The entire first scene fades out, then the couple appears on a carved oval pedestal with a closer view of the same pink room and satin. Replay fades back to the closed invitation and repeats the sequence.

## Development

- `npm install`
- `npm run dev`
- `npm run build`

## Motion

The box is one 3D scene. A rear hinge rotates the complete lid, its outer artwork and the inner mirror together. The base remains fixed. A recessed platform raises the figurines after the lid clears them; closing reverses the mechanism. The sculpture rotates continuously around a vertical axis with a gradual speed ramp and a twelve-second revolution. There are no sprite-frame changes or crossfades between closed/open box pictures.

The renderer pauses when the tab is hidden and becomes idle when the box is closed. Repeated sculpted parts are merged by material to reduce drawing work on phones. The opening always unfolds gradually over six seconds, with a 4.5-second closing. Reduced motion keeps the sculpture still. Slow frames cannot skip opening stages, and interior shaders are prepared before accepting the first click.

The mirror uses reflected figurine geometry and a circular stencil mask in the main render pass. It does not render the room a second time. Soft contact shadows replace per-frame shadow-map passes. Small ornaments use fewer vertices, and the canvas pixel ratio is calibrated before interaction. Every opening stage is drawn into the hidden canvas before enabling the box, warming the actual framebuffer and stencil paths. Background filters are kept out of the animation path.

- `src/components/MusicBox3D.tsx`: renderer, timing, lighting, lifecycle and visibility.
- `src/components/musicBoxModel.ts`: fixed body, hinged lid, mirror and platform.
- `src/components/weddingFigurines.ts`: loads the detailed, painted wedding sculpture.
- `src/components/mirrorReflection.ts`: single-pass reflected geometry and mirror mask.
- `src/components/weddingPedestal.ts`: carved oval display base for the second scene.
- `src/App.tsx` and `src/scene.css`: invitation layout and controls.

Existing generated artwork is used as texture on the box surfaces. Background and texture assets are in `public/images/`; their generation prompts remain in `generation-prompts.txt`. The older couple sprite sheets are retained as source assets but are no longer loaded.

`public/images/closed-box-initial.png` is a transparent render of the current closed 3D model. It is preloaded and occupies exactly the same bounds as the canvas while graphics prepare, avoiding a change of box design at startup. Regenerate it with the local `.preview/capture-box.mjs` helper when changing the closed model or its camera/lighting.

The next scene is prepared during initial loading and reuses the canvas. Its stationary, camera-facing couple uses a transparent Imagegen portrait on the centered oval pedestal. The first scene fades completely before the prepared pedestal frame is revealed. The second scene stops rendering once settled.

Browser checks cover automatic opening, the three-second hold after full opening, scene fading, a stationary second-scene pose, canvas reuse, replay, and desktop/mobile layout.

## Detailed wedding sculpture

The figurine is adapted from [Bride and Groom Figurine on Remeshy](https://remeshy.com/model/bride-and-groom-figurine-196413b6-b8a), listed as CC0 in its public model metadata. Its source and license are recorded in `public/models/wedding-couple.LICENSE.txt`.

The original 25 MB, 300,000-triangle asset was cropped to remove its built-in base, smoothed, simplified to 47,181 triangles, painted with vertex colors, and normalized to the existing animation rig. The shipped GLB is approximately 0.95 MB. The box scene and its mirror use this sculpture. No external model host is contacted at runtime.

The final scene instead uses `public/images/wedding-dance-static.png`, a semi-realistic couple in a fixed ballroom pose generated with Imagegen. Its prompt is saved alongside it in `wedding-dance-static.prompt.txt`. `src/components/staticWeddingFigure.ts` crops transparent padding through texture coordinates and anchors the couple to the pedestal without rotation.

To reproduce the asset from a downloaded original GLB, run from the project root:

```text
node scripts/model-tools/prepare-couple.mjs path/to/original.glb
node scripts/model-tools/paint-couple.mjs
```

The preparation scripts use the glTF Transform and meshoptimizer development dependencies. Intermediate geometry is written under the ignored `.preview/` directory.



