# STRANDED — island art and visual QA

The survival scene uses a grounded cinematic cove, compact dark green HUD surfaces, sand accents, and Barlow Condensed / Manrope / IBM Plex Mono typography. The same tokens style the expedition workbench, rival scenario, reports, and field guide.

## Artwork

All new bitmap art was generated with the built-in ImageGen tool, inspected, then converted to WebP with alpha preserved for cutouts. Original generated files remain in the Codex generated-images directory. The existing camp and treasure-map JPEGs are preserved but are not used by the active survival screen.

- `public/art/island-cove.webp`: 1672 × 941 environment, no built shelter or escape boat.
- `public/art/island-cove-mobile.webp`: smaller 960 × 540 environment for phones.
- `public/art/shelter-stages.webp`: 2172 × 724 transparent atlas, four stages in a row. Stage 0 has no structure. CSS selects stages 1–4.
- `public/art/boat-parts.webp`: 2172 × 724 transparent atlas. The source's unequal object bounds are selected through SVG viewports so parts are not stretched or clipped to arbitrary equal cells. Hull, rigging, rudder, and provisions render independently. Parts are staged on the beach until the hull is built.

Weather tint applies to both the environment and structures; rain is a CSS layer. Reduced-motion preferences disable motion. The base picture has a gradient fallback if it fails to load; construction status is always available in the HUD and inventory.

### Generation prompts

**Environment:** Create a production game environment background asset for STRANDED, grounded cinematic illustrated 2.5D tropical island survival game. Wide landscape 1536x1024 or wider 16:9. Elevated view from the edge of a lush jungle over a sweeping white sand cove and turquoise ocean. Distant rugged green island headland on upper right, broken ancient wooden shipwreck offshore at far right. Dense realistic palm foliage framing left and upper edges, a freshwater creek entering the beach on the left midground. Golden late afternoon sunlight, atmospheric haze, premium matte painted realism, subtle brushwork, restrained rich natural greens and blue teal water, immersive not cartoon. Composition important: lower half is clear bare sandy beach; reserve clear bare sand at left middle for future shelter overlay, clear bare sand at right lower-middle for future boat overlay. NO shelter, NO tent, NO boat on beach, NO people, NO campfire, NO tools or supplies, NO text, NO UI, NO borders. Art fills entire image edge to edge. This is only the base environment to composite game-state structures onto.

**Shelter atlas (transparent background):** Game sprite atlas for a grounded cinematic tropical island survival game. TRANSPARENT background, wide horizontal image, four equal square cells in ONE ROW, no lines or borders or text. Each cell contains the SAME small palm-thatch A-frame survival shelter in 3/4 elevated perspective facing camera-right, with consistent scale position and golden sunlight from upper right, photorealistic matte painted game art, warm weathered driftwood poles and dried palm leaves. EXACTLY FOUR shelters left to right: cell1 primitive small lean-to with sparse thatch and two poles; cell2 A-frame roof with more woven palm thatch and open front; cell3 sturdy enclosed hut with wood slat side walls; cell4 reinforced hut with dense thatch roof, cross-braced wood walls and low protective wooden windbreak. All structures completely within their equal quarter of the image, centered, no overlap, soft contact shadow immediately underneath. NO ground, NO beach, NO vegetation around shelter, NO people, NO UI, NO boats, NO numbers, NO text. True transparent alpha. All four cells same framing and size, rendered as individual cutout sprites.

**Boat atlas (transparent background):** Game sprite atlas of FOUR separate catamaran construction parts for a grounded cinematic tropical survival game, true TRANSPARENT alpha background. Wide horizontal image with EXACTLY FOUR EQUAL SQUARE CELLS in ONE ROW; no text, numbers, grids, dividers. Same elevated 3/4 camera perspective looking at boat broadside with bow pointing RIGHT, sunlight from upper right, photorealistic matte-painted art, weathered wood and natural rope, consistent scale across cells. Cell 1: bare simple wooden twin-hull catamaran with connecting crossbeams, NO mast NO sail NO rudder NO supplies. Cell 2: ONLY a tall wooden mast and tan triangular sail with rope rigging, NO boat hull. Cell 3: ONLY a wooden rudder with dark iron fasteners attached to a long keel plank, no boat hull. Cell 4: ONLY a compact bundle of dried provision sacks and sealed water gourds tied with coir rope. Each isolated part centered inside its own equal quarter, full object visible with generous transparent margin, no part overlaps another cell. NO ocean, NO sand, NO people, NO shelter, NO scenery. Production cutout sprites designed for compositing onto a beach background.

## Verification

`npm run build` type-checks and creates the production app. Secondary modes load on demand; the survival entry does not load React Flow and Recharts up front. `npm run lint` reports existing legacy warnings but no errors.

With Vite running, `/qa/scene.html` is an isolated development-only visual fixture. Its controls cover shelter stages 0–4, all boat-part combinations, all four weather states, and ACTIVE/WON/LOST screens. It never sends game API requests or edits saved expeditions. This entry is not included in the production build.

For interaction QA, use the main app: inspect a hotspot, review costs and locked reasons, execute an available action, dismiss an outcome, open inventory/map/journal, request and dismiss a hint, and reload to verify resume. Check keyboard Escape and restored focus in dialogs and menus. Phone dialogs become bottom sheets; chart locations also have a text button list.

Backend tests also verify that explicit Bayesian evidence selections (including an empty selection) override weather defaults. Backend tests verify that every lifecycle response and hint response exposes `action_options`, that available IDs match `valid_actions`, and that progression and terminal-state locks reflect engine rules. Deploy the frontend and updated backend together; existing `valid_actions` consumers remain compatible.

The Rival Duel preserves the existing backend's independent analysis scenarios, rather than pretending it persists a separate multiplayer world. Each round records a directive and its measured search response. Algorithm Race now uses actual benchmark metrics and ranks by execution time; it does not display preset winners or fabricated live progress.
