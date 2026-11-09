# Pearl Mobile Opening

A mobile opening built with React, TypeScript and Vite. The pearl background fills
the phone viewport; larger screens keep the experience centered at 540px maximum.
The burgundy card starts forming 1.4 seconds after the background loads. The ring
appears at 3 seconds. There is no timed navigation.

The active ring is extracted directly from the user's
`Screen Recording 2026-11-05 131243.mp4`. Its photographed diamond, setting, pavé
shank, engraving and reflection are retained. Generated ring views and procedural
3D models are not used by the active screen.

The clean section is recording frames 1–106: 3.533 seconds at the original 30 fps.
It shows **partial rotation**, not a complete 360-degree turn. The source screen
recording begins with its embedded player at approximately 00:08; later wedding
text obscures the ring. Missing views are not invented or mirrored. Playback runs
from source frame 106 back to frame 1 so the clearest available diamond-face angle
is held before enlarging and descending. This remains an oblique view; a directly
front-facing view is not present in the supplied recording.
Completing the exact ring's full turn requires the unobstructed original footage.

`public/videos/ring-recorded-end-facing.mp4` packs the 260 × 178 photographed crop and
its synchronized alpha mask into a 520 × 178 H.264 video. It uses streaming metadata
at the beginning of the file. The visible resolution remains the recording's native
crop resolution; it is not an HD reconstruction.

The matte is closed and small interior holes are filled so photographed dark facets
stay opaque. The original reflection remains in the same frames. Source zoom is
stabilized by uniform scaling; the ring is displayed at 50% size throughout the
available rotation. After the clip ends, it grows to the existing final size of
75% and descends by 35% of its container height over 3.5 seconds. Its opacity fades
smoothly from 100% during the rotation to 25% at the final enlarged pose.
A frame-smoothed colour correction strengthens exposure and contrast,
removes the burgundy cast from the silver, and softens highlight clipping. Low-signal
reflection pixels receive less correction so the reflection stays subdued.
The matching `public/images/ring-recorded-end-facing.png` is shown while
loading or if playback/WebGL is unavailable. Reduced-motion preferences show a
static small ring.

The frame and entrance timings are in `src/App.tsx` and `src/index.css`. Playback
and packed-alpha decoding are in `src/media/createRingVideo.ts`, mounted by
`src/RingScene.tsx`. The post-motion size and position are in `src/three/ringIntro.ts`.

## Asset pipeline

Run `scripts/extract-original-ring.py` with the portable Blender 4.2 executable to
extract the native 260 × 178 crop at x=290, y=408. Run
`node scripts/matte-original-ring.mjs --vivid`, then run `scripts/encode-original-ring.py`
with Blender and `-- --vivid --end-facing`. Intermediate frames, video and metadata are under the ignored
`.preview/original-ring/` directory. Copy the encoded movie into `public/videos/`,
then use `scripts/faststart-ring-video.mjs` and `scripts/probe-ring-video.mjs` to
prepare and inspect it. The original recording is retained unchanged.

Earlier generated references, atlases and rendered turntables are kept as inactive
artifacts. The earlier model's attribution is in
`public/models/diamond-ring.LICENSE.txt`; the former generated reference prompt is
in `docs/ring-reference-angular.md`.

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

The background `public/images/rose-pearl.png` was created with the built-in image
generation tool. Its brief was a full-bleed 9:16 macro pink mother-of-pearl texture,
with flowing dusty rose/mauve swirls, pearly highlights and layered shell striations.
