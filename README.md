# New Project

A realistic ivory embroidered envelope with pearl highlights. All four flaps move together after 4.8 seconds, or on tap, in one continuous 6.5-second motion. Each slides straight outward past its own edge without rotating: top up, bottom down, left left and right right. There is no intermediate scene, pause or crossfade. The garden is already rendered behind the closed envelope. Replay resets the sequence. CSS motion respects reduced motion preferences. Adjust `--opening-duration` and `--opening-ease` in `src/scene.css` to tune the movement.

- `npm install` installs dependencies.
- `npm run dev` starts the development server.
- `npm run build` checks TypeScript and creates a production build.
- `npm run lint` checks the source code.

Start in `src/App.tsx`. Static assets belong in `public/`.

## Assets

Generated interpretations of the supplied reference, using the built-in image generation tool:

- `public/images/ivory-envelope.png`: closed embroidered envelope.
- `public/images/ivory-lining.png`: empty matching interior.
- `public/images/ivory-palace.png`: architectural second scene, generated from the supplied reference.
- `public/images/ivory-swans.png`: final garden with two swans, generated from the new reference without lettering, numbers or logo.
- `public/images/ivory-pool.png`: matching garden with both baked-in swans and their reflections removed.
- `public/images/swan-cutout.png`: transparent white swan facing right, mirrored for the second bird.
- `public/images/wedding-monogram.png`: transparent ornamental gold wedding monogram.
- `public/images/invitation-branches.png`: transparent matching pair of leafy side sprays for the final scene.

`src/WaterGarden.tsx` renders the pool separately from the swans. The enlarged monogram and `14 · 11 · 2026` appear in sequence. Delicate leafy sprays then emerge along both side edges, sway gently up and down, and release falling leaves. Afterwards the monogram and date disappear, and each line of the Arabic and English blessing descends into place on its own. Original floral branches remain still. Fountain streams have moving highlights, falling droplets and splash rings. Both swans sit close together and glide a few pixels with reflections and wakes. Reduced motion shortens the text reveal and keeps the side branches still.

The production prompts are recorded in `public/images/prompts.txt`.

