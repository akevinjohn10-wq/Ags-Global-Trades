# tools/ — reference and backup, not part of the website

Nothing here is built or served (Vite only ships `src/` and `public/`). These are the
scripts behind the services scroll story's images and the local preview setup, kept so
any later session can change or regenerate the art instead of starting over.

Paths inside the scripts are absolute (`/home/claude/ags-global-trades/...`, `/tmp/...`)
from the session that wrote them; adjust them before running.

## story-art/ (Python 3 + numpy + scipy + Pillow)

| Script | Makes | Used by |
|---|---|---|
| `world.py` | `public/story/parts/world-v4.webp` and `world-m-v4.webp`: the aerial rainforest with the road that comes in from the left, turns a corner (radius 300) and runs down the page. World 2600 x 3800 px, rendered at 1.15x. Road constants `YH, R, CX, WR` must match `W_YH, W_R, W_CX, W_ROAD` in `Story.tsx`. ~1 min. | Story leg 2 |
| `fog.py` | `fog-a.webp`, `fog-b.webp`: tileable soft fog with alpha | fog over the forest and the loading-bay fog transition |
| `backdrop.py` | `ground-side.webp` (asphalt strip with gravel edge, side view). It also writes three pine-treeline layers (`tree-*.webp`) that were rejected as cartoonish and are not in the site. | Story leg 1 road strip |

`truck-aerial-v2.webp` is not generated: it is `truck-top.webp` from `redesign-v2` rotated
180 degrees so the cab faces down the page (`Image.open(...).rotate(180)`).

`old/` holds earlier versions, for reference only: the first 1600 px world, the pine forest
version, the forest-yard version with a warehouse (top-down loading idea, rejected), the
straight tileable forest, and the top-view forklift and crate sprites.

## preview/ (Node)

`build.sh` + `build-css.mjs`: a quick local build (esbuild + Tailwind v4 compile) into
`/tmp/site`, served with `python3 -m http.server 8123`. The `*.cjs` files are Playwright
scripts that screenshot the story at set scroll positions (desktop 1440x900 and phone 390x844).

## Where the versions live

- `drive-preview` branch: current draft (fog transition, rainforest road, blue grade,
  Apple-style top bar, Apple fonts site-wide). Not live.
- `main` / `redesign-v2`: the live site.
- Rejected tries, kept on GitHub: `scroll-film-preview` (scroll-scrubbed films),
  `story-real-preview` (realistic sprites on asphalt).
