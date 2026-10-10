# StrayConnect arcade design

The mobile app uses flat yellow, mint, pink and purple surfaces, black borders,
square corners and solid offset shadows. Silkscreen is used for display text;
Poppins remains the readable body and form font. Color tokens live in
`src/design/theme.js`.

## Native setup

Run `npm install`, then `npm run android` (or `npm run ios` on macOS) to build a
development client containing Expo GL. A JavaScript reload alone cannot add the
native GL module. Existing clients without that module show the pixel sprite.

`PetAvatar` builds an original voxel dog directly with Three.js box geometry and
unlit materials. It has a subtle bob, turn and tail wag, pauses when its screen
loses focus or the app enters the background, and disposes its geometry,
materials and renderer on unmount. Reduced motion uses the static pixel sprite.
No remote model or texture downloads are required.

## Screen behavior

- Welcome: a tappable companion console with four rounded Three.js characters
  (dog, heart-eyed cat, smiling cow and bunny), generated surface grain, soft
  lighting and a shrink/pop transition. Each has its own idle gesture. Reduced
  motion keeps the detailed model but disables idle/transition movement; missing
  GL uses a matching emoji. Rendering pauses when the screen or app is inactive.
- Home: virtual-pet console, animated voxel mascot and tactile actions.
- Browse: colorful photo cards, pixel placeholders, existing search and filters.
- Passport: segmented vaccine/medical record counts, existing record tabs and actions.
- SOS: prominent reporting action, bordered form controls and pixel sighting pin.
- Profile, authentication, events, notifications and settings: shared typography,
  palette, square surfaces and hard shadows.

Real animal photos remain the source for identification. The mascot is decorative.
Care-log blocks count records; they never claim a medical assessment or vaccine
coverage. No fabricated rescue score, leaderboard, or animal status is introduced.

## Verification

`node --test tests/*.test.mjs` runs the existing behavioral regression suite.
`npx expo export --platform android --output-dir .expo/redesign-export` validates
the production Android JavaScript bundle and Hermes bytecode.
