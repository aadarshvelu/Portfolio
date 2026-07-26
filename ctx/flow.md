# Director's Cut — Portfolio Flow

> **Single source of truth** for this project. Replaces the old scatter of
> `.claude/ctx.md`, `plan.md`, `skill-*.md`, `Directors-cut.md`, `The-upgrade.md`,
> `exit-notice.md`, `content-audit.md`, `README_PLACEMENT.md`, and `README.md`.
> Written from the build as **verified live in the browser** (not from the older
> spec docs, some of which had stale copy/tech). When a doc disagreed with the
> running site, the running site won.

**Stack:** React 18 + `@react-three/fiber` (R3F v8) + `@react-three/drei` + `three` 0.171, built with Vite.
**Run:** `npm run dev -- --port 3004` (launch config `portfolio-dev` in `.claude/launch.json`).
**Tab title:** "Aadarsh Velu — Director's Cut".

---

## 0. What it is — one paragraph

A cinematic, scroll-driven WebGL portfolio styled as a **35mm film / Director's Cut**.
It opens in a **dark late-night study room** (desk, lamp, hand-written note, pen,
retro CRT TV, window, flip clock, ceiling fan). The camera scroll-**dollies into the
CRT screen**, which is a **portal** revealing the real film underneath. The film then
plays as one continuous reel: **The Origin** (self-taught beginnings) → a **confetti
celebration** and **carrier-reel tumble** into **The Upgrade** (credentials as
polaroids) → **The Crafts** (three project case studies as a newspaper) → a
**hand-written closing note** → **Contact**. Everything is one **continuous,
reversible window-scroll**; scroll up and every beat rewinds. No page switches, no
remounts, no hard cuts — only dollies, pans, and dissolves.

---

## 1. Architecture & the one scroll timeline

Two stacked layers on a single window-scroll, mounted from frame zero and never recreated:

- **Layer 1 (bottom):** the real film — `src/App.jsx` → `<Viewport><Hero/></Viewport>` + a `1500vh` scroll runway. Always mounted.
- **Layer 2 (top):** `src/concept/ConceptIntro.jsx` — the room, a `position:fixed; inset:0; zIndex:10; pointer-events:none` overlay containing the Concept R3F canvas (`alpha:true`) + DOM grain/vignette + a "scroll" hint. Never captures scroll, so the page and the Hero stay interactive. The canvas wrap, fx layer, and "scroll" hint all start at `opacity:0` and fade in over 500ms once a `ReadySignal` child inside the Canvas fires its first `useFrame` tick — that is the earliest moment the R3F pipeline has resolved Suspense (GLBs + fonts) and drawn a pixel. Kills the "dark blue vignette + SCROLL" flash that used to paint over an empty canvas while the room warmed up.

**On boot:** there is no separate opening card. Attempted ports of the movie-branch "Life is a film. This is my story." intro (as a DOM canvas, then R3F+troika, then raw WebGL, then pure CSS/SVG feTurbulence) all shipped visible lag or init failures on top of the two heavy R3F canvases mounting behind. Removed. If we ever re-add it, the correct architecture is to render it as a layer *inside* the room's Canvas (so it shares one WebGL init, the movie pattern) — not as an independent top overlay.

**Entry:** `main.jsx` → `PortfolioExperience.jsx` (the integration root). It wraps
`<App/>` + an intro scroll runway `<div height={INTRO_SCREENS*100}vh>` + `<ConceptIntro/>`
inside `IntroFreezeContext.Provider value={{ introPx }}`.

- `INTRO_SCREENS = 4` → `introPx = window.innerHeight * 4` (recomputed on resize).
- **Timeline:** `scrollY ∈ [0 .. introPx]` = room → CRT-portal entry; `[introPx .. end]` = the Hero. Scroll up rewinds both.
- **Hero offset:** `Hero.jsx` reads `useIntroFreeze().introPx` and offsets its own progress: `progress = clamp((scrollY − introPx) / ((scrollHeight − innerHeight) − introPx), 0, 1)`. While in the room (`scrollY < introPx`) the Hero sits at progress 0 (its opening). No boolean lock — fully reversible.
- **Boot gate:** the Hero's opening/reveal timeline is gated to start only once the Hero is `entered` (latched when progress first > 0), so it plays when the visitor arrives, not while hidden behind the room.
- `src/App.jsx` and `src/components/Viewport/*` are pre-existing and **unchanged** (Viewport is `position:fixed; inset:0; height:var(--app-h)`; no z-index → sits below the intro overlay).

Reference sizes (desktop 1920×863): `introPx ≈ 3448`, total `scrollHeight ≈ 16378`, `maxScroll ≈ 15516`.

---

## 2. The Room Intro — `src/concept/`

A dark, config-driven WebGL room. **Every transform lives in `src/concept/config/sceneConfig.js`** — no hardcoded transforms in components. Change a number, save, the browser updates live.

### Scene graph (`src/concept/Scene.jsx`, inside the Canvas)
```
<LayoutProvider value={buildLayout(device)}>
  <CameraRig phase/>                      // dollies along the device's camera profile
  ambient 0.22 + hemisphere + Environment(3× Lightformer)   // procedural reflections, no HDR
  <mesh backdrop @ z=-9 opaque #050407/>  // makes the alpha canvas solid except the portal hole
  <Room/> <Desk/> <Paper/> <Lamp/> <Pen/> <Television/>
  <CeilingFan/> <Curtain/> <Clock/> <DustParticles/>
  <fog #050407 6..16/>
</LayoutProvider>
```
- `Scene` eases `phase.current` toward window-scroll `progress.current` each frame (`k = 1 − 0.0015^delta`, symmetric so reverse rewinds) and publishes it to `phaseOut` so the DOM wrapper fades in lockstep.

### The pieces
| File | Role |
|---|---|
| `ConceptIntro.jsx` | always-mounted overlay; owns scroll→phase, room fade, device detection. |
| `Scene.jsx` | composition + `LayoutProvider` + phase smoothing. |
| `CameraRig.jsx` | drives the camera along the active device's profile path. |
| `Room.jsx` | floor, back wall, window (night sky + frame + muntins), moonlight (directional, shadows), TV cold-bleed pointlight. |
| `Desk.jsx` | procedural wooden desk. Exports `DESK_TOP_Y = 0.75`. |
| `Paper.jsx` | the hand-written note. **One `<Text>` per line** (no `\n`). Tilts up about its NEAR edge so it reads. Dims as the TV takes over. |
| `Lamp.jsx` | `lamp.glb` + warm spotlight (target = paper) + bulb glow. Modulated by `roomBreath`. |
| `Pen.jsx` | `pen.glb`, rests on the paper lower-right. |
| `Television.jsx` | the CRT — GLB + curved-screen shader + portal hole + broadcast reel (canvas-texture text) + colored room glow. Most-iterated file. |
| `Curtain.jsx` | sheer translucent window curtain, gentle wave. |
| `Clock.jsx` | retro FLIP desk clock, real local time, amber status LED, minute flip. |
| `DustParticles.jsx` | lamp-cone-constrained micro dust (InstancedMesh). |
| `AssetModel.jsx` | generic GLB loader: clone, shadows, bbox-log, helpers, applies sceneConfig transform + alignment correction. |
| `sceneConfig.js` | desktop base / source of truth for ALL transforms + light props. `DESK_SURFACE_Y = 0.75`. Fan block removed (fan deprecated). |
| `transitionConfig.js` | portal thresholds: `heroRevealStart 0.84`, `heroRevealEnd 0.99`, `roomFadeStart 0.94`, `roomFadeEnd 1.0`. |
| `cameraProfiles.js` / `layoutProfiles.js` / `layoutContext.js` | responsive device profiles (see §5). |
| `sanitizeText.js` | strips `\r`, zero-width, nbsp, **all non-ASCII**, trims. |
| `roomBreath.js` | `{ warm: 1 }` shared signal: fan writes, lamp reads. |

**Assets** (`public/assets/3d/`): `lamp.glb` (scale 0.016), `tv.glb` (scale 95, modelled tiny), `pen.glb` (scale 0.05). Do NOT assume GLB orientation — tune with `debugConfig.js` helpers (axes/bbox/model-info logging).

**GLB compression:** all three GLBs are meshopt-compressed + WebP-textured via `@gltf-transform/cli optimize --compress meshopt --texture-compress webp --texture-size 1024`. Combined size dropped from **2.17 MB → 270 KB** (~8×). drei's `useGLTF` auto-configures both DRACOLoader and MeshoptDecoder from `three-stdlib`, so nothing extra is needed in code. Originals live in git history — to recompress after regenerating an original, back it up, run `npx --yes @gltf-transform/cli optimize <in> <out> --compress meshopt --texture-compress webp --texture-size 1024`, and swap in place. All three files are also `<link rel="preload" as="fetch" crossorigin>` in `index.html` so the browser starts fetching them before React mounts.

### The CRT (`Television.jsx`)
- `makeCurvedScreen(w,h,bulge)` → PlaneGeometry displaced so the centre bulges toward the viewer.
- **No glass shell mesh** (it produced a moving "oval" reflection that washed the text — removed).
- `screenMat` = custom `ShaderMaterial` (transparent, `depthWrite:false`, `toneMapped:false`), renderOrder 6. Vibrant phosphor field glowing in `uTint`, with **text composited INTO the signal** (60s-TV look) *before* scanlines, so scanlines/curvature/glow run through the letters. Then scanlines, shadow-mask RGB triads, gentle vignette (flat centre, no hotspot), mild bloom, signal-lock shimmer, rounded-corner SDF mask.
- `holeMat` = MeshBasicMaterial with **CustomBlending Zero/Zero on colour AND alpha** → forces the framebuffer to `(0,0,0,0)` over the curved hole geometry (`depthTest:false`, renderOrder 5, visible only when reveal>0). With the alpha canvas this reveals the App/Hero beneath — perspective + curve correct, no projection math.
- **Broadcast reel:** ONE title card at a time (not a strip/marquee). Text drawn to an offscreen `1024×768` 2D canvas → `THREE.CanvasTexture` → `uText`. Fonts loaded as CSS web-fonts (`@fontsource/...`) for the canvas. HOLD 4.5s → cross-dissolve 1.2s. Cards cycle through the chapter titles (THE ORIGIN / FIRST LIGHT / THE UPGRADE / 50,000 RESUMES / THE BOARDROOM / CONTACT / "AI helped write the code. The creativity is mine."). The tuned card colour also drives the screen-glow pointLight, spilling the broadcast colour onto desk/paper/wall.

### The portal (room → Hero), fully reversible
Driven entirely by `phase` (smoothed window-scroll). As `reveal` (0.84→0.99) rises, `uOpacity = 1−reveal` cross-fades the CRT picture out while the hole punches through (alpha 0) so the Hero shows in the glass; signal-lock adds analog stabilization (no digital glitch). `ConceptIntro` reads `phaseOut` in a rAF loop and sets the room canvas opacity to `1 − smoothstep(phase, roomFadeStart, roomFadeEnd)` plus the grain/vignette/hint fades. At phase→1 the room is fully transparent → the Hero fills the frame. Scroll back up → everything rewinds.

---

## 3. The Hero film — `src/components/Hero/` (chapter by chapter)

> **Carousel (in progress):** the reel is an infinite ring (4 chapters tiled by slot in `FilmRoll`, edge-fade to dark). Prev/next are **in-scene R3F meshes** (`CarouselArrows.jsx`, clickable via the Hero canvas raycaster) — NOT DOM buttons, to avoid stacking/pointer-events fights with the room overlay. **Critical infra:** the concept room's canvas is forced `pointer-events:none !important` (`.concept-canvas` in concept/styles.css) so clicks fall THROUGH the room (zIndex 10, on top) to the Hero canvas below — without it, nothing in the Hero is clickable. Arrow visibility is gated by scene phase (`idle && !focus`), not scroll heuristics. Next: Model B per-chapter scroll flows + Play→countdown.
>
> ⚠️ **The Hero was reverted to the `movie` branch baseline (pending a revamp).** The chapter-by-chapter detail below describes the *previous* vision-branch Hero and is now STALE — re-verify after the revamp. The only concept-room integration preserved through the revert is the **`introPx` scroll offset** in `Hero.jsx` (`useIntroFreeze()` → `progress = (scrollY − off) / (maxScroll − off)`), which keeps the room→Hero handoff working. Note: the movie Hero's boot (`useBootSequence`/`BootOverlay` "Life is a film") fires on mount again (plays behind the room, done by arrival) rather than gated-on-entry. A snapshot of the pre-revert vision Hero is in the session scratchpad (`hero-backup-*`).

> Positions below are approximate desktop `scrollY`. **They are NOT reliable markers** — the Hero's scroll→scene is very heavily smoothed (see §7 gotcha). The ORDER is fixed; the numbers drift.

### Act I — The Origin
1. **CRT hand-off → FIRST LIGHT.** Night sky, crescent moon, drifting clouds, shooting stars. Chroma-split title **FIRST LIGHT**. A film-reel strip of frames (PROLOGUE "Cold Open", THE ARCHITECT "Aadarsh — technical lead", **THE ORIGIN "First Light — before anyone was watching"** (centre), THE WORK, THE RECORD "Notes — from the cutting room"). Corner chrome: wordmark "Aadarsh Velu / LEAD TECHNICAL ARCHITECT · DXB / ELYT8 INFORMATION TECHNOLOGY", "REEL Nº01 · FRAME 001/240 · ASA 400T · LENS 35MM ANAMORPHIC", "AVAILABLE FOR ENGAGEMENT · RUNTIME 04:32", "SCROLL · ENTER CHAPTER I".
   - *Hero idle only:* the film roll supports arrow/dot carousel navigation (GSAP), and the title runs a per-character Mexican-wave. Once scrolling begins, click interaction ceases and scroll drives everything.
2. **FIRST LIGHT chapter fills the frame** (title top-left "I. THE ORIGIN 2018–2020"; bottom-left "before anyone was watching / SELF-TAUGHT / FOCAL / PRESS PLAY").
3. **OriginBeat narration** scrolls up the right lane on a convex text-drum: *The compiler didn't care how old I was → Every night one more problem on HackerRank → I rebuilt every data structure by hand, Java, from scratch → Then I built a visualizer — algorithms you could watch run → **DSA Visually ↗** (link) → Pay Perform hired me at eighteen, London, remote → Senior engineer by twenty — SM Technology gave me the keys to production → Then AI arrived, and I walked straight into it — MLOps, LLM pipelines, PieLabs → Now I architect the systems at Elyts — and still write the first line myself → It was never homework. It was always the thing itself.*

### The Celebration (≈ hero-progress 0.29–0.39)
4. **Confetti burst** — gold-foil + tiny navy film-frame shards explode from a cone emitter across the sky as the last narration line lands (instanced mesh, gravity, lifetime-fade).
5. **Carrier-reel tumble** — one 3D film frame streaks toward the camera, spins, and scales up to fill the viewport, dissolving into The Upgrade. The Upgrade title + polaroids are already printed on the incoming celluloid.

### Act I.b — The Upgrade
6. **THE · UPGRADE slate.** "● The Origin · Continued ●" / **THE · UPGRADE** / *after the first light* / "SCROLL · ENTER THE SCENE". Clapperboard top-left (Prod. A.VELU / Scene I.b / Shot 01 / Take 02 / Date 2020–PRESENT / Dir. SELF). Corner chrome "CHAPTER I — CONT'D · 2020–PRESENT", "SC I.b · BEAT 01/03", "PAGE 14 · DRAFT 02 / REV C". Three aged-parchment polaroids scattered lower-right.
7. **Polaroid zoom chain** — the camera zooms into each polaroid; the placeholder crossfades to a voice-over card:
   - **KAGGLE** (2020–2025, "first run"): *I wanted to understand the machines — not just build with them. So I went to the foundations: math, statistics, the slow parts. Practiced on Kaggle until the intuition came.* — Credential: **Kaggle — 3× Expert**, → kaggle.com/aadarshvelu.
   - **AWS** ("P.S. — FOR THE RECORD", "p.s. / end of reel"): *And — for the record — an AWS Solutions Architect, and an ISO 42001 Lead Auditor. (the cloud on paper, the AI governance too.)* — Credential: **AWS SA Associate 2023**, **ISO/IEC 42001 Lead Auditor**.
   - **IIM KOZHIKODE** (2025–2026, "the upgrade / not a pivot, an upgrade"): *Then the ground shifted. When the tool writes the code, the bottleneck moves — the business problem under the ticket. So I went back for what code can't teach: judgment.* — Evidence: eMDP · Strategic Management · Batch 06.

### Chapter II — The Crafts
8. **Newspaper masthead "THE CUTTING-ROOM"** — "VOL II · Nº03 · LATE EDITION · NIGHT FILE · SIX PAGES · ₹0", "FILED · 03:42 AM · A. VELU · LEAD TECHNICAL ARCHITECT · ELYTS IT · TUE MAY 2026", *all the news the workbench saw fit to file*, "REEL Nº02 · CHAPTER II · THE CRAFTS · 2022–PRESENT".
9. **Three project case studies**, each a newspaper story with a "STORY Nº0x · Filed · Built at Elyts IT" strip, deck, body, pull-quote, OUTCOME line, STAFF (tech) line, and three annotated phone/app mockups (the `fig_*.png` transparent PNGs):
   - **"ONE FEED. MINE."** (Syndicate) — AI news dedup feed. *Five sources. Same story. …A small program pulls every source overnight, removes the duplicates… runs on his laptop while he sleeps. No cloud. No cost. Also publishes as a static PWA and a Claude Code plugin.* Pull: *"Five sources in. One summary out."* STAFF: Python · DSPy · Ollama · Gemma 4 · Qwen · Claude Code.
   - **"THE TOOL THAT RAN THE TEAM."** (Hourglass) — internal ops tool (AI Standup Assistant / Smart Time Tracking / AI Pre-Call Planner). *Started as a timesheet… eventually it ran the meetings too.* Pull: *"Started as a spreadsheet. Ended up running the team."* OUTCOME: 10× the work, same team · nothing falls through. STAFF: React · Node.js · MS Teams · AI · Azure.
   - **"50,000 RÉSUMÉS. ONE DECISION."** (HireHouse) — AI hiring screener. *…find the best candidates automatically, reducing hiring noise by ~80%, and left the final call to the human. …like a tournament. The best rise. A human still picks.* Pull: *"Résumés compete. Videos compete. The best rise. You decide."* OUTCOME: 50,000+ résumés · ~80% noise cut. STAFF: React · Node.js · AI/LLM · Video.

### The closing note & Contact — `ExitNoticeChapter.jsx`
10. **"A Note · For the Record — Filed by Hand"** — a cream cardstock in Courier bold, marked in red pen: **"AI helped me write the code."** (wavy underline) / **"The creativity is mine."** ("creativity" circled, "always was. ↘" note) / **"So is the intelligence."** ("intelligence" circled). Signed **"Aadarsh Velu — May '26"**. This is the thesis, and it **deliberately mirrors the CRT's closing broadcast card** back in the room.
11. **Contact.** Clapperboard top. "REEL Nº02 · CONTACT · WHERE TO REACH HIM" → **"The director takes calls."** on a warm dawn gradient:
    - EMAIL `find.out@whoisaadar.sh` · WEB `whoisaadar.sh` · LINKEDIN `linkedin.com/in/aadarshvelu` · INDIA `+91 86100 47522` · UAE `+971 52 807 0820` · *"Two phones · one inbox · one domain · always answering."*

**ExitNotice implementation note:** `ExitNoticeBackdrop` (full-viewport cream plane, masks the newspaper) + `ExitNoticeChapter` (cardstock + content) mount as siblings of `paperGroup`, viewport-aligned (sized from `camera.fov` + `peelDist`). The "dolly feel" comes from card scale 0.92→1.0 while opacity ramps, NOT a camera move (camera stays parked on Story 3). Reveal is a pure function of chapter-local `p` (staggered: text → marks → note → signature), so reverse scroll is deterministic. RenderOrder: newspaper 72/73/74, **backdrop 73.5, cardstock 82, card text 83, marks/sig 84** (the wide 73.5→82 gap is intentional — same-renderOrder transparent sort can flip).

---

## 4. Responsive system

- `deviceUtils.getDeviceType(w)`: desktop ≥1280, tablet ≥768, mobile <768. `useDeviceType()` updates on resize/orientation; `window.__forceDevice` overrides for testing.
- Room: `buildLayout(device)` = per-device profile DELTAS over `sceneConfig` **with fallback** (`pick(profileVal, sceneConfigVal)`), provided via `LayoutProvider` INSIDE the Canvas. `cameraProfiles`: desktop = `SCENE_CONFIG.camera`; tablet tighter; mobile low/close portrait. **TV/lamp/pen/clock keep the same world position across devices** so the dolly END is shared — responsive resizing is done via CAMERA distance, not `tv.scale` (changing tv.scale resizes the GLB body but NOT the screen overlay → mismatch).
- Hero: `useBreakpoint()` + `layouts.js` per-breakpoint values; `coverFov()` keeps the design rect full-bleed (crops overflow, never letterboxes). Mobile viewport height locked via `--app-h`.
- **Open item:** tablet & mobile compositions have not yet been visually verified end-to-end.

### 4a. Mobile plan for The Room (`src/concept/`)

The camera/layout scaffold already exists (per-device `cameraProfiles` + `layoutProfiles` + `useDeviceType`); mobile needs the perf + viewport pieces on top. Four workstreams:

**Mobile portrait composition (at rest, phase 0) — "gallery wall".** The desk shot doesn't fit a tall narrow screen, so on mobile the note HANGS on the wall in a **picture frame with its own spotlight**, and the TV is lifted to the upper wall — a clean top(TV)/bottom(framed note) stack the camera faces head-on:
```
        PHONE — portrait (~390 × 844)
        ┌───────────────────────┐
        │        ╔═════════╗     │  TV lifted to upper wall,
        │        ║   TV    ║     │  centred, facing camera
        │        ╚═════════╝     │  (tvPosition [0,2.05,0])
        │                       │
        │     ┏━━━━━━━━━━━┓      │  the NOTE hangs in a frame,
        │     ┃ I build   ┃      │  lit by its own spotlight
        │     ┃ things.   ┃  ·※· │  (paperWall:true, [0,1.05,0])
        │     ┃ ...       ┃      │
        │     ┗━━━━━━━━━━━┛      │
        │        scroll ☟        │  cue bottom-centre on mobile
        └───────────────────────┘   camera fov 56, head-on, dollies UP into TV
```
Implemented via: `paper.wall`/`paper.frame`/`paper.lit` in sceneConfig (desktop `wall:false`, `lit:false`); `Paper.jsx` wall mode (vertical sheet + 4 frame rails) and a `lit`-gated sibling spotLight (so the desk note stays glowing on mobile where the lamp is dropped); `Desk.jsx` reads `useLayout().desk` so `deskPosition` can push the table toward the camera; `Scene.jsx` gates lamp/pen/clock/dust off when `device !== "desktop"` (mobile AND tablet use the stripped portrait shot); `layoutProfiles.{mobile,tablet}` set the portrait deltas; `cameraProfiles.{mobile,tablet}` are the head-on portrait dolly. **A splash failsafe** (ConceptIntro, 1500ms) force-lifts the black splash even if the room's first `useFrame` never fires, so mobile can't get stuck on a pure-black screen. All numbers are config knobs for live tuning.

**⚠️ Camera-through-the-glass gotcha:** the CRT screen sits at world `z = tvPosition.z + screen.z(0.4)`. Every camera `position.z` in the mobile/tablet path MUST stay ABOVE that — if the dolly crosses the screen plane it renders the glass's **mirrored back-face** (the broadcast text appears backwards), which showed as "weird screens" between the TV and the FIRST LIGHT reveal on mobile/tablet only. The paths approach from the front and stop at `z ≈ 1.62` (screen ≈ 1.2). Move the endpoint whenever you move `tvPosition.z`.

**The scroll dolly (phase 0 → 1)** — same room, mobile path (`cameraProfiles.mobile`, fov 60→42):
```
  phase 0.0        phase ~0.4        phase ~0.75        phase 1.0
 ┌─────────┐     ┌─────────┐       ┌─────────┐        ┌─────────┐
 │ ·  TV  · │     │  ╔════╗  │      │╔═══════╗│        │  FIRST  │
 │ ┌──────┐ │ ──► │  ╚════╝  │ ──►  │║  TV   ║│  ──►   │  LIGHT  │
 │ │ note │ │     │ ┌──────┐ │      │║ fills ║│        │ ▓ reel ▓│
 │ └──────┘ │     │ └ fade ┘ │      │╚═══════╝│        │ (Hero)  │
 │ scroll ☟ │     │          │      │ portal  │        │         │
 └─────────┘     └─────────┘       └─────────┘        └─────────┘
  paper-led       tip up to TV      dolly into CRT     Hero revealed
```

**Pipeline** — width → device → three per-device configs feed the render:
```
   getDeviceType(innerWidth)  ⇒  <768 mobile · 768–1279 tablet · ≥1280 desktop
        ├── CAMERA_PROFILES[dev]   fov + dolly path        (exists ✓)
        ├── LAYOUT_PROFILES[dev]   paper/prop deltas        (exists ✓)
        └── QUALITY_PROFILES[dev]  dpr/shadow/env/dust      (Phase A ✓)
                     ⇒ buildLayout(dev) ⇒ <LayoutProvider> ⇒ components
```

**Workstream #1 — quality tiers** (`config/qualityProfiles.js`, attached to `buildLayout().quality`):

|            | desktop | tablet | mobile |
|---|---|---|---|
| Canvas `dpr` | [1,2] | [1,1.75] | [1,1.5] |
| `shadows` | soft | soft | basic |
| lamp `shadow-mapSize` | 2048² | 1024² | 512² |
| Environment `resolution` | 64 | 48 | 32 |
| dust `count` | 36 | 28 | 18 |
| `antialias` | on | on | off |

The lamp's 2048² shadow map is the single heaviest cost on a phone.

**Workstream #2 — viewport lock.** On phones the URL bar show/hide resizes a `position:fixed inset:0` canvas mid-scroll → aspect flips, the dolly lurches. Fix: size the room canvas to `var(--app-h)` and compute `introPx` from `--app-h` (the tallest-viewport value App.jsx already measures and only re-locks on a REAL resize — never on chrome show/hide). The dolly then holds perfectly still while scrolling.

**Workstream #3 — framing polish (needs a real device):** add aspect-aware FOV so a narrow portrait doesn't over-crop the desk; route landscape phones to tablet-ish framing; tune the mobile path/paper live.

**Workstream #4 — the cue.** `.concept-hint` is desktop-tuned (`left/top` %); add a mobile media query → bottom-centre, smaller glyph.

**Build order:** Phase A = #1 + #2 (perf + stability, buildable/verifiable headless). Phase B = #3 + #4 (iterative, tuned on a real phone). **Fidelity call:** full 3D room with quality tiers first (already slimmed — fan gone, GLBs 8× smaller); only fall back to a lighter scene if real-device testing shows jank.

**Phase A status: DONE + adversarially reviewed.** Correctness gotchas locked in from the review:
- **Do NOT key the room `<Canvas>` on `device`.** A remount resets Scene's smoothed camera phase (`useRef(0)`) → the dolly snaps back to the room-start shot mid-scroll on a breakpoint crossing (e.g. phone rotation), and the anti-flash splash can't re-arm (Hero flashes through the alpha canvas). Instead let `dpr` / `shadows` / camera path / env / dust update LIVE via props; `gl.antialias` + shadow-map size stay first-mount-sticky (acceptable on a rare mid-session device change).
- **The room's scroll→phase effect depends on `[introPx]`** (not `[]`), so a real resize recomputes room progress immediately instead of leaving it stale until the next scroll (mirrors Hero's `[introPx]` scroll effect).
- **`--app-h` lock (App.jsx) re-locks on width change OR a debounced `100lvh` delta.** `100lvh` is invariant to URL/toolbar show-hide (so scroll never re-locks → no jitter) but shrinks on a genuine window resize (split-screen / foldable / multi-window), which the width-only guard missed.

---

## 5. File map (quick)

```
src/
  main.jsx                     → PortfolioExperience
  PortfolioExperience.jsx      → <App/> + intro runway + <ConceptIntro/>, IntroFreeze provider
  App.jsx                      → <Viewport><Hero/></Viewport> + 1500vh runway   (unchanged)
  concept/                     → the room (see §2)
    config/{sceneConfig,transitionConfig,debugConfig,debugTransitionConfig,
            assetAlignmentConfig,deviceUtils,cameraProfiles,layoutProfiles}.js
    {ConceptIntro,Scene,CameraRig,Room,Desk,Paper,Lamp,Pen,Television,
     CeilingFan,Curtain,Clock,DustParticles,AssetModel,Overlay}.jsx
    {IntroFreeze,layoutContext,roomBreath,sanitizeText}.js  styles.css
  components/Hero/
    Hero.jsx  Scene.jsx  config.js  layouts.js  breakpoint.js
    effects/CrtEffect.jsx
    scene/{Title,FilmRoll,FilmFrame,Chrome,ScrollPrompt,OriginBeat,
           CraftsChapter,ExitNoticeChapter,sCurvePath.js,...}.jsx
    scene/upgrade/{UpgradeScene,Polaroid,TitleSlate}.jsx
  fonts.js                     → troika font URLs (Anton, DM Mono, Cormorant)
public/assets/3d/{lamp,tv,pen}.glb   public/assets/fig_*.png
```

---

## 6. Design system (durable rules)

**Aesthetic:** a film reel projected in a dark theatre. Every element belongs on celluloid, not a webpage — Saul Bass titles, Criterion menus, film grain, sprocket holes, registration marks.

**Colour** (no new colour without film-world justification):
`PEARL #f2e8d8` (primary text/wordmark) · `GOLD #c8a157` (accents/subtitles/badges) · `CREAM #ede4d2` (body narrative) · `MUTED #6f6c61` / `META #9b9789` (chrome/metadata) · `HR_GREEN #2ec866` (HackerRank accent only) · `BG_NAVY #0a0e1a` (night sky) · `PAPER #e8dcc8` (newspaper/postcard) · `RED_PEN #c0392b` (hand annotations only).

**Type:** **Cormorant Italic 500** = display/narrative (titles, beats, headlines, voiceover). **DM Mono 400** = chrome/metadata (HUD, reel numbers, credentials; letter-spacing 0.22–0.32). **Courier Prime Bold** = the exit postcard handwriting. (Anton is used for the big newspaper headlines.)

**Motion principles:**
1. **Scroll is the only input** (except hero-idle film-roll carousel). 2. **Smoothed, never snapped** — space scroll events ≥ ~0.02 apart. 3. **Camera moves, world stays** — content is already placed in 3D; the camera dollies/pans to reveal it; content does not translate into slots. 4. **Dissolve > cut** — opacity fades for all enter/exit; hard cuts break the film metaphor. 5. Confetti = instanced mesh (gold foil + film chips, cone emitter, gravity, lifetime fade). Easing = `smoothstep`.

**Don'ts:** no rounded corners (film has sharp edges) · no CSS-gradient UI (gradients only in sky/atmosphere) · no box-shadow-looking shadows · no bright/saturated accents (warm, aged, analog) · no emoji/modern icons (use ●, ★, Nº, ↗, —) · no visible scrollbar · full-bleed darkness to every edge · oversized cinematic type.

---

## 7. Rules, gotchas & known issues (harvested from prior memory + docs)

**Verification (WebGL):**
- Verify on a **real GPU** — Claude-in-Chrome `computer screenshot` (or Playwright real-GPU). The in-app preview pane and **background/hidden tabs pause `requestAnimationFrame`** → the R3F Canvas stays black at 300×150. If needed, nudge the container size to force the ResizeObserver: `cc.style.width = innerWidth+'px'; cc.style.height = innerHeight+'px'; window.dispatchEvent(new Event('resize'))`.
- **⚠️ Slow-smoothing gotcha (cost real time):** the Hero's scroll→scene is very heavily smoothed. After a big `window.scrollTo` jump the scene keeps easing for **5–8+ seconds**; a 2 s screenshot catches an IN-TRANSIT frame (often black, or a blended/wrong chapter), so `scrollY → chapter` from jump+short-wait is unreliable. To capture a real settled beat, **scrub gradually** (~200–300 px steps, ~1.6 s apart, in the natural scroll direction), or park and settle 6–8 s.

**Text / troika:**
- Troika renders an embedded `\n` as a **tofu □** in this build → **one `<Text>` per line**, or draw to a canvas (the CRT). Sanitize all glyphs to ASCII (`—`/`É`/`·`/`█` were tofu sources → use `-`, `RESUMES`, etc.).
- Troika `<Text>` **`fillOpacity` cannot be set imperatively via ref** — it must go through the React prop (`useGroupFade`/`useFade` → `fillOpacity` prop). `position.y` CAN be set imperatively (standard Three.js property).
- Use `depthOffset` + `material-depthTest/Write={false}` on troika text to avoid z-fighting / broken SDF depth-write shadow artifacts.

**Rendering:**
- Flat 2D compositing: every flat layer must be `transparent` so it sorts by `renderOrder` (opaque planes render in the opaque pass and get painted over). Keep clear renderOrder separation for same-layer transparent objects (three's transparent depth sort can flip them).
- Custom `ShaderMaterial` `gl_FragColor` is **NOT** re-encoded linear→sRGB by three (unlike built-in materials and troika `<Text>`). If a custom shader looks ~40–50% too dark/cold, you may be double-gamma-ing — output authored sRGB directly. (Lesson from the abandoned `src/vision/` rebuild; still worth remembering for concept shaders.)
- Physically-based lights (three 0.171): use high intensities (spot ~95, point ~6–14). `spotLight target-position` does not update the target's world matrix — bind `spot.target = <object3D>` and `updateMatrixWorld()`.

**Don't-retry (previously failed):**
- **CraftsChapter figure borders** — newspaper-style border frames around the `fig_*.png` mockups failed 3+ times due to renderOrder conflicts and were reverted every time. Do **not** retry without explicit direction and a new approach.

**Known copy issues** (from the content audit — not yet actioned, low priority):
- FilmFrame "seventeen reels" is an unverifiable count (site shows ~3 projects).
- IIM-K voiceover "the business problem under the ticket" is jargon; "seventeen reels", the two Upgrade scroll hints ("ENTER CHAPTER I" vs "ENTER THE SCENE"), "Twitter" (renamed), and the Hourglass body's duplicated first two paragraphs were all flagged for tightening.
- Point-of-view intentionally shifts: first-person (Origin/Upgrade/Note) vs third-person (the newspaper's editorial voice) — this is deliberate, not a bug.

**Historical context (do not resurrect):**
- The old `.claude/plan.md` described a **Next.js 14 + Tailwind + GSAP + Lenis** build on an orphan `portfolio-v2` branch. That tech stack is **stale** — the real build is the R3F app above. Plan.md was only ever useful as **story/narrative canon** (project names Syndicate/Hourglass/HireHouse, credential list, career timeline, the "adopted as official company products" impact line).
- `src/vision/` (a standalone WebGL rebuild of a console-TV) was **abandoned and deleted**; the room-intro approach here replaced it.

---

*Contact of record: `find.out@whoisaadar.sh` · `whoisaadar.sh` · `linkedin.com/in/aadarshvelu` · +91 86100 47522 · +971 52 807 0820.*
