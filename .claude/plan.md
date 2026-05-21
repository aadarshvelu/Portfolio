# Director's Cut — Portfolio Build Plan (v5 — post review)

## Concept
Director's Cut — cinematic scroll, letterbox bars, gold Dubai accent, chapter-card pacing.
Steals merged: load-to-black hard cut · SVG annotation callouts · colophon close.

---

## Project Location
`c:\srcs\Portfolio\` — new orphan branch `portfolio-v2` (no history from master)

---

## Theme

| Token | Value |
|-------|-------|
| `--bg` | `#080808` |
| `--text` | `#F0EDE6` |
| `--accent` | `#C8A96E` |
| `--muted` | `#6B6560` |
| `--surface` | `#111010` |
| `--deep` | `#0D0C0B` |

**Fonts:** Cormorant Garamond 300/500/700 · DM Mono 300/400 · Inter 400

---

## Tech Stack
Next.js 14 (App Router, TypeScript) · Tailwind CSS v3 · Lenis v1 · GSAP 3 + ScrollTrigger · Framer Motion · SVG feTurbulence grain · next/font · Vercel
**Three.js stack (Contact hologram only):** `@react-three/fiber` · `@react-three/drei` · `three` · `@types/three`

## Animation Ownership Rules (CRITICAL — agents must follow)
- **GSAP + ScrollTrigger** owns: all scroll-driven transforms (pins, scrubs, horizontal rail x-translation, clip-path reveals, SVG stroke-dashoffset traces, letterbox bar compression, hero scale)
- **Framer Motion** owns only: non-scroll-triggered entry fades (credential badge slides in Identity, timeline entry fades on IntersectionObserver)
- **ScrollTrigger initialized once** in `providers.tsx` via `gsap.registerPlugin(ScrollTrigger)`. Agents use `useGSAP` hook scoped to component refs — never call `ScrollTrigger.create()` globally in a component.
- **Lenis disabled** during load sequence (0–1800ms). Re-enabled after load completes.

## Screen Experience — The Wow on Every Device

The cinematic contract: letterbox bars + Cormorant Garamond + chapter cards + clip-path reveals are NEVER removed — they are what makes every screen feel like a film, not a webpage. Only layout and motion mechanics adapt.

---

### MOBILE SCROLL EXPERIENCE (`< 768px`)

**Load sequence** — identical. Black → DM Mono typewriter → letterbox bars 2vh → hard cut name. Lenis lock preserved. Same drama, smaller frame.

**Hero** — name fills the letterbox at `clamp(48px, 14vw, 80px)`. No GSAP pin (no pinning on mobile). Name is a static centrepiece. Letterbox bars are permanent at 2vh. Subtitle below name in Inter 14px. Scroll pulse at bottom.

**Chapter cards** — full-width, identical style. Hard cut in/out. No change.

**Origin** — 7 clip-path line reveals, same stagger. Year spine hidden — replaced by a subtle DM Mono year stamp left-aligned inline with each beat (2016, 2020, 2022). IIM-K narrative and Cormorant italic quote preserved.

**Projects** — Vertical cards, each `100vh` tall. The wow mechanic: as each card enters viewport, a gold SVG border traces around it (stroke-dashoffset, same as desktop frame entry). Then content reveals. Card anatomy top → bottom:
```
[gold SVG border traces on entry]
  
  01 / SYNDICATE                [DM Mono, muted, top-left]
  
  [screenshot, bleach bypass, 55% card height, full width]
  
  "Every AI breakthrough..."   [Cormorant italic, 20px, gold]
  PYTHON · DSPY · OLLAMA       [DM Mono muted, 11px]

  ── LABELS (stagger fade-in, 80ms each):
  DEDUP ENGINE → 4-stage dedup
  INFRA COST   → $0.00/month
  → github.com/aadarshvelu/syndicate   [gold link]
```
No horizontal scrub. No pin. Each card is its own moment.

**Timeline** — SVG spine hidden. Entries are vertical with left border gold line. Cappriosec: tap toggles the redaction reveal (CSS `[data-revealed]` toggle on tap). Same visual, touch-adapted interaction.

**Identity** — Pull-quote centered, Cormorant 28px. Takes full screen. Credential badges: Framer Motion fade-up stagger (same motion, no x-slide — too wide for mobile).

**Contact** — Single column. Headline Cormorant 48px. Links + resume. Hologram hidden. DUBAI · MMXXVI at bottom.

---

### TABLET SCROLL EXPERIENCE (`768px – 1279px`)

**Load sequence** — identical to desktop. Same timings, bars at 3vh.

**Hero** — GSAP pin is OFF on tablet (same as mobile — pinning with scrub on touch is unreliable). Name at `clamp(72px, 10vw, 120px)`. Letterbox bars 3vh permanent after load. Subtitle fades on scroll entry (IntersectionObserver, not scroll scrub).

**Chapter cards** — identical to desktop.

**Origin** — same as desktop. Year spine hidden on tablet (viewport too narrow for side margin). Year stamps inline (same as mobile approach).

**Projects** — Horizontal scrub KEPT on tablet. The pin + GSAP x-translate is the signature motion mechanic and works well in landscape tablet. Frame layout within each 100vw frame: stacked (image top 55%, text + labels bottom 45%) — the left/right 50/50 split is too cramped at 768px. Annotation callouts: DM Mono label list below image (same as mobile, no SVG lines). Gold SVG border traces on each frame entry: preserved.

```
[pinned container, horizontal scrub]
  Frame 01 — 100vw
    [screenshot, bleach bypass, top 55%]
    ─────────────────────────────────
    01  SYNDICATE
    "Every AI breakthrough..."
    PYTHON · DSPY · OLLAMA
    DEDUP ENGINE → 4-stage
    → github.com/...
  
  Frame 02 — 100vw (scrolls in from right)
    [Hourglass content, same stacked layout]
  
  Frame 03 — 100vw
    [HireHouse content]
```

**Timeline** — Same as desktop minus year spine side margin. Entries full-width. Cappriosec: tap to reveal (same as mobile).

**Identity** — Pull-quote Cormorant 36px. Credential badges: slide from right preserved (Framer Motion — viewport is wide enough).

**Contact** — Two rows: top row text, bottom row hologram (50% opacity, centered, IntersectionObserver lazy mount). Headline Cormorant 56px.

---

**Breakpoints:**
| Name | Range | Tailwind prefix |
|------|-------|----------------|
| Mobile | `< 768px` | default |
| Tablet | `768px – 1279px` | `md:` |
| Desktop | `≥ 1280px` | `xl:` |

> **Rule:** Every component is written mobile-first. Desktop/tablet overrides added in the same file, same pass. No "responsive pass later."

---

### Per-Component Responsive Spec

| Component | Mobile (`<768px`) | Tablet (`768–1279px`) | Desktop (`≥1280px`) |
|-----------|-------------------|----------------------|---------------------|
| **LetterboxBars** | `2vh` top + bottom | `3vh` | `10vh → 4vh` (GSAP compressed) |
| **Grain** | same | same | same |
| **ScrollProgress dots** | hidden | hidden | 4 dots, right edge fixed |
| **Hero — name size** | `clamp(48px, 14vw, 80px)` | `clamp(72px, 10vw, 120px)` | `clamp(100px, 12vw, 180px)` |
| **Hero — pin** | no pin, static text | no pin, static text | pinned ~200vh, GSAP scrub |
| **Hero — subtitle** | below name, Inter 14px | same | fades on scroll |
| **ChapterCard** | full width, centered | full width, centered | full width, centered |
| **Origin — clip-path reveals** | preserved, single column | preserved, single column | preserved |
| **Origin — year spine** | hidden | hidden | right edge SVG, draws on scroll |
| **Origin — font sizes** | Cormorant 32px beats | Cormorant 40px | Cormorant 48px |
| **Projects — layout** | vertical stacked cards | horizontal scrub (keep — tablet landscape works) | horizontal scrub, 300vw rail |
| **Projects — card** | full width, image top + text below | `50vw` each frame, side-by-side | `100vw` frame, split left/right |
| **Projects — annotation callouts** | DM Mono label list below image | DM Mono label list below image | SVG leader lines on image |
| **Projects — pin** | no pin | pinned, GSAP scrub | pinned, GSAP scrub |
| **Timeline — Cappriosec** | tap to reveal (no hover) | tap to reveal | hover to reveal |
| **Timeline — spine** | hidden | right edge, half-width | right edge, full |
| **Identity — pull quote** | Cormorant 28px | Cormorant 36px | Cormorant 48px |
| **Identity — credential badges** | stacked, full width, Framer fade-in | stacked, max-width 480px | slide from right, stagger |
| **Contact — layout** | single column, text only | single column + hologram below (50% opacity) | two columns 50/50 |
| **Contact — hologram** | hidden | visible, below text | right column, 60% opacity |
| **Contact — headline** | Cormorant 48px | Cormorant 56px | Cormorant 72px |

---

## Asset Paths
```
public/
├── assets/
│   ├── Preview/
│   │   ├── syndicate/SS-1.png        ← PWA mobile news feed
│   │   ├── hourglass/SS-1.png        ← Sudo Projects standup view
│   │   ├── hourglass/SS-2.png        ← Pre-call note / MoM in Teams
│   │   └── hirehouse/SS-1.png        ← ELO pool / candidate ranking
│   └── Aadarsh_Resume.pdf            ← Resume download
```

All screenshots: `filter: contrast(1.15) saturate(0.3) brightness(0.85)` (bleach bypass)

---

## Links & URLs (to be filled by user before build)
- Hourglass landing page: `[USER TO PROVIDE]`
- HireHouse landing page: `[USER TO PROVIDE]`
- Kaggle profile: `[USER TO PROVIDE]`
- DSAVisually: `https://dsavisually.netlify.app/`
- DSA Java GitHub: `[USER TO PROVIDE]`
- Syndicate GitHub: `https://github.com/aadarshvelu/syndicate`

---

## KEY IMPACT STATEMENT
> "Hourglass and HireHouse were built for internal use. The organization was so impressed, they adopted both as official company products — now distributed to fellow organizations."

Appears in: (1) each project frame annotation callouts · (2) Identity section Beat 2

---

## SCROLL PROGRESS INDICATOR
Chapter dots — not a top progress bar. 4 dots, right edge of viewport, fixed position. Each dot corresponds to one chapter card. Active dot fills gold as that chapter is in view. More cinematic than a generic progress bar.

---

## FULL SCROLL STORY

---

### LOAD SEQUENCE (0ms–1.8s)
*Lenis disabled. Scroll locked.*
```
0ms    → Pure black. Nothing.
600ms  → DM Mono typewriter left-to-right:
         "LEAD TECHNICAL ARCHITECT. DUBAI. AGE 25."
1200ms → Letterbox bars slide in top + bottom (translateY, 600ms ease-in-out)
1800ms → "AADARSH VELU" hard cuts in. No fade. No ease.
         Cormorant Garamond, fills letterbox frame.
         Gold scroll pulse at bottom center.
         Lenis re-enabled. 1s dwell before scroll detection begins.
```

---

### SECTION 1 — OPENING TITLE (Hero, pinned ~200vh)
GSAP `pin: true, scrub: 1`
- 0–50%: Name scales to fill letterbox. Subtitle fades out.
- 50–80%: Gold hairline draws center of frame (SVG stroke-dashoffset).
- 80–100%: Letterbox bars compress 10vh → 4vh (permanent). Pin releases.

*Mobile: no pinning, name is large static text, bars at 2vh.*

```
[10vh bar]
AADARSH
VELU
─────────────────────────────────
LEAD TECHNICAL ARCHITECT · DUBAI
                     ↓ [gold pulse]
[10vh bar]
```

---

### CHAPTER CARD I — "THE ORIGIN" (pinned ~80vh)
```
━━━━━━━━━━━━━━━━━━━━━━━
  Chapter I — The Origin
━━━━━━━━━━━━━━━━━━━━━━━
        2016
```
Hard cut-in (opacity 0→1 instantly on entry). Pins 80vh. Hard cut-out.

---

### SECTION 2 — THE ORIGIN (free scroll, ~500vh)

*Agent 4 note: Generous padding between beats. Year spine on right gives visual rhythm throughout.*

**Beat 1 — The story (7 clip-path line reveals, staggered 120ms):**
```
"Two years of programming."
"Java. Fundamentals. A pandemic."

"I couldn't showcase what I'd learnt."
"So I built a DSA visualizer using React."
"Win-win."

"It got traction."
"It got me a job. At eighteen."
```
Gold (`--accent`): `React` · `traction` · `eighteen`

**Beat 2 — DSAVisually callout:**
*(Inline reference, not a card. Visually connects to Beat 1's "got me a job" line.)*
```
── DSAVisually ──────────────────────── 2020 ──
Sorting algorithms · graph traversal · search —
visualized in real time. Built to learn. Shipped to get hired.

→ dsavisually.netlify.app
→ github.com/[DSA_JAVA_REPO]          [DSA Java code]
```
DM Mono, muted. Both links gold on hover.

**Beat 3 — AI learning:**
*(Inter, muted paragraph)*
*"Wanted to learn AI. Started with math and statistics. Practiced on Kaggle until it made sense."*

```
KAGGLE 3× EXPERT — DATASET · NOTEBOOK · DISCUSSION
→ kaggle.com/[KAGGLE_PROFILE]                         [DM Mono, gold link]
```

**Beat 5 — Credentials + IIM-K narrative:**

IIM-K gets a brief narrative beat before the credential line — not just a badge drop:
```
[Inter, muted — fades in after Kaggle beat]

When Cursor writes the code, the bottleneck moves.
The engineers who matter now understand *why* something
should be built — the business problem underneath the ticket.

IIM Kozhikode — Strategic Management.
Not a pivot. An upgrade.

"When the tool handles the syntax,
 judgment becomes the only remaining moat."
```
*(Cormorant italic for the closing quote. Gold on "judgment". Clip-path reveal same as Beat 1 lines.)*

Then credentials list:
```
AWS SOLUTIONS ARCHITECT — ASSOCIATE             FEB 2023
IIM KOZHIKODE EXECUTIVE ALUMNI — STRATEGIC MANAGEMENT
```
*(Full "IIM Kozhikode" for international legibility)*

**Right edge throughout — SVG year spine:**
`2016 → 2020 → 2022 → 2024 → 2025`
*(Draws on scroll entry via stroke-dashoffset. Stops at 2025 to align with work narrative start.)*

---

### CHAPTER CARD II — "THE WORK" (pinned ~80vh)
```
━━━━━━━━━━━━━━━━━━━━━━━
  Chapter II — The Work
━━━━━━━━━━━━━━━━━━━━━━━
      2022 — Present
```

---

### SECTION 3 — THE WORK / PROJECTS (horizontal scrub, pinned ~500vh)

**Desktop:** 3 frames on 300vw rail. GSAP `x: 0 → -200vw`, scrubbed, pinned.
**Mobile:** Vertical stacked cards, no pin, standard scroll.

Each frame entry (desktop): gold SVG border traces via `stroke-dashoffset` → content fades after 80% drawn.
All screenshots: bleach bypass `filter: contrast(1.15) saturate(0.3) brightness(0.85)`

---

**FRAME 01 — SYNDICATE**

LEFT:
```
01                                          [DM Mono, muted]
SYNDICATE                                   [Cormorant, 96px]
──────────────────
"Every AI breakthrough lands
 in five different newsletters.
 The same story. Five times.
 I wanted one feed. Mine.
 So I built it."                            [Cormorant italic, 28px, gold]

Local LLM. Git as a database. Zero cost.    [Inter, muted]

PYTHON · DSPY · OLLAMA · GEMMA4 · QWEN · PWA
→ github.com/aadarshvelu/syndicate
```

RIGHT (`assets/Preview/syndicate/SS-1.png`, bleach bypass):
```
Annotation callouts (SVG leader lines, DM Mono labels):
  DEDUP ENGINE ──→ "4-stage: URL → fuzzy → simhash → semantic"
  SOURCE MIX   ──→ "Gmail newsletters · RSS · Twitter"
  MODEL        ──→ "Gemma4 local · Qwen embeddings"
  INFRA COST   ──→ "$0.00 / month"
```

---

**FRAME 02 — HOURGLASS**

LEFT:
```
02
HOURGLASS
──────────────────
"At peak scale, I was tracking
 twelve people across spreadsheets.
 I was the bottleneck.
 So I built the system that
 replaced that version of me."              [Cormorant italic, 28px, gold]

Started as a timesheet.
Became the ops layer the team
stopped noticing — because it ran.          [Inter, muted]

REACT · NODE.JS · MS TEAMS · AI · AZURE
→ [HOURGLASS LANDING PAGE]                  [primary CTA]
→ hourglass.elyts.tech                      [live app]
```

RIGHT (`SS-1.png` + `SS-2.png` stacked, bleach bypass):
```
Annotation callouts:
  MS TEAMS      ──→ "Primary interface — not just notifications"
  PRE-CALL NOTE ──→ "Auto-posted before every standup"
  POST-CALL MoM ──→ "AI captures decisions + action items"
  TODO TRACKING ──→ "Each status → tracked reminder"
  COMPANY STATUS ─→ "Adopted as official company product"
  DISTRIBUTION  ──→ "Now used by fellow organizations"
```

---

**FRAME 03 — HIREHOUSE**

LEFT:
```
03
HIREHOUSE
──────────────────
"My manager was unreachable.
 Three hours of hiring calls a day,
 screening people who shouldn't
 have made it past the resume.
 I built the filter he needed —
 without removing the human
 from the final decision."                  [Cormorant italic, 28px, gold]

Chess logic. Resumes compete.
Videos compete. The best surface.
You decide.                                 [Inter, muted]

REACT · NODE.JS · AI/LLM · VIDEO PROCESSING
→ [HIREHOUSE LANDING PAGE]                  [primary CTA]
→ hirehouse.elyts.tech                      [live app]
```

RIGHT (`assets/Preview/hirehouse/SS-1.png`, bleach bypass):
```
Annotation callouts:
  STAGE 1       ──→ "Resume → AI extraction → ELO pool"
  STAGE 2       ──→ "Top ELO → video (curated questions)"
  STAGE 3       ──→ "Video responses → ELO scored + ranked"
  RESULT        ──→ "~80% hiring noise eliminated"
  COMPANY STATUS ─→ "Adopted as official company product"
  DISTRIBUTION  ──→ "Now used by fellow organizations"
```

---

### CHAPTER CARD III — "THE RECORD" (pinned ~80vh)
```
━━━━━━━━━━━━━━━━━━━━━━━
 Chapter III — The Record
━━━━━━━━━━━━━━━━━━━━━━━
      2020 — Present
```

---

### SECTION 4 — THE RECORD / CAREER (free scroll)

Vertical timeline, newest-first. SVG spine (stroke-dashoffset) draws ahead of entries.
Each entry: Framer Motion `opacity: 0, y: 20 → opacity: 1, y: 0` on IntersectionObserver.
Current role: pulsing gold dot (CSS keyframe, 2s infinite).

```
● NOW  LEAD TECHNICAL ARCHITECT
       Iterative Research Tech Ltd            NOV 2025 → PRESENT
       Namio Finance · Easevia · Sigma
       Hourglass · HireHouse
       ↳ Building: Hyperliquid trading bot_   [cursor blink, gold]

│
●      AI FULL-STACK ENGINEER
       PieLabs Inc                             MAR 2025 → NOV 2025
       Automating QA with AI · ML pipelines · LLM production deployment

│
●      IT ANALYST / FULL-STACK ENGINEER
       Intellectyx                             MAY 2024 → FEB 2025
       LMS · SCORM · Azure Entra ID · Multi-region (UK/USA/EU)

│
●      SENIOR SOFTWARE ENGINEER
       SM Technology                           FEB 2022 → MAY 2024
       Modular architecture · Plugin systems · 2 yrs 4 mos

│
▓  [DELETED SCENE — 2021]                      [DM Mono, dimmer than muted — ~40% opacity]
   CAPPRIOSEC SECURITIES
   ██████████████████████████████████████████
   ████████████ · ██████ · ████████ · ██████
   "Ask me about it."

   ↑ On hover (desktop): redaction dissolves, reveals:
   CPO · CYBER AUDIT · VAPT TESTING
   SAT DOWN WITH CEOs AT 20.
   CLOSED A $200 DEAL. LOVED EVERY SECOND.
   DIDN'T MAKE IT. DID IT ANYWAY.

│
●      JUNIOR SOFTWARE ENGINEER
       Orbital                                 JAN 2021 → FEB 2022
       Chennai, India

│
●      TRAINEE SOFTWARE ENGINEER
       Orbital                                 JUN 2020 → DEC 2020
       First role. Built on the back of DSAVisually.
```

---

### CHAPTER CARD IV — "THE ARCHITECT" (pinned ~80vh)
```
━━━━━━━━━━━━━━━━━━━━━━━
Chapter IV — The Architect
━━━━━━━━━━━━━━━━━━━━━━━
      2016 — Present
```
*(Full arc timestamp — this section synthesizes everything.)*

---

### SECTION 5 — THE ARCHITECT / IDENTITY (pinned ~300vh)

Beat 1 (0–35%): Primary pull-quote (Cormorant italic, 48px, centered):
*"I don't just build systems. I build businesses that run on systems."*

Beat 2 (35–55%): Secondary statement fades in (Inter, muted):
*"Hourglass and HireHouse were built for internal use. The organization adopted both as company products — now distributed to fellow organizations."*

Beat 3 (55–80%): Three credential badges slide from right (Framer Motion, x: 100vw → 0, stagger 0.15s):
```
AWS SOLUTIONS ARCHITECT — ASSOCIATE            FEB 2023
IIM KOZHIKODE EXECUTIVE ALUMNI — STRATEGIC MANAGEMENT
KAGGLE 3× EXPERT — DATASET · NOTEBOOK · DISCUSSION  → [link]
```
*(Credentials appear here as culmination — not a repeat of the Origin section list.
Origin = when he got them + the IIM-K "judgment moat" narrative.
Identity = what they mean together: architect of systems AND business judgment AND data instinct.)*

Beat 4 (80–100%): Gold hairline extends full width. Pin releases.

---

### SECTION 6 — CONTACT / COLOPHON (final frame)

Background `--deep`. Letterbox bars remain at 4vh (2vh mobile).
Gold rule draws left → right (GSAP scaleX: 0 → 1) on scroll entry.

**Desktop layout — two columns (50/50):**

LEFT column:
```
AVAILABLE FOR
AMBITIOUS PROBLEMS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
keep
aadarshvelu@gmail.com
linkedin.com/in/aadarshvelu
github.com/aadarshvelu

→ Download Resume                    [DM Mono, links to /assets/Aadarsh_Resume.pdf]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DUBAI · MMXXVI
```

RIGHT column — **Hologram portrait** (Three.js R3F canvas):
```
[HologramPortrait component — gold tinted, 60% opacity]
Boot animation fires on IntersectionObserver entry:
  Person materialises as visitor reaches final frame.
```

**Mobile:** Single column, text only — hologram hidden (`display: none` below 768px).

*"AVAILABLE FOR AMBITIOUS PROBLEMS" — not "Commissions" (artist language) or "Hire Me" (desperate).
Cormorant Garamond 72px headline · DM Mono links · DUBAI · MMXXVI colophon dateline.*

---

### HOLOGRAM SPEC (Contact section, right column)

**Source:** `green` branch — copy these files verbatim, then apply changes below:
- `src/shaders/hologram-portrait.glsl.ts` → `src/shaders/hologram-portrait.glsl.ts`
- `src/components/hero/HologramPortrait.tsx` → `src/components/HologramPortrait.tsx`
- `src/lib/animation-state.ts` → `src/lib/animation-state.ts`
- `public/br_i.png` → `public/br_i.png` (portrait texture — dark line art)

**Changes from green branch:**

1. **Color retheme** — change glow from green to gold in `HologramPortrait.tsx`:
   ```ts
   // BEFORE (green):
   uGlowColor: { value: new THREE.Color(0.8, 1.0, 0.85) }
   // AFTER (gold #C8A96E):
   uGlowColor: { value: new THREE.Color(0.784, 0.663, 0.431) }
   ```

2. **Strip heavy effects** — new `HologramCanvas.tsx` wrapper (do NOT copy HeroCanvas.tsx):
   ```tsx
   // Minimal canvas — no EffectComposer, no Bloom, no Drones, no Particles
   <Canvas dpr={[1, 1.5]} camera={{ position: [0, 5.8, 18], fov: 45 }}>
     <HologramPortrait />
   </Canvas>
   ```
   CSS glow replaces Bloom: `filter: drop-shadow(0 0 30px #C8A96E55)` on canvas wrapper div.

3. **Lazy render** — only mount canvas when Contact section enters viewport:
   ```tsx
   // Contact.tsx: IntersectionObserver on section ref
   // Mount <HologramCanvas /> only when isInView === true
   // Prevents Three.js init cost until user reaches final frame
   ```

4. **Boot animation** — already in `HologramPortrait.tsx` GSAP timeline (scanline 0→1 + boot progress). Trigger start when `isInView` flips true.

**No new Three.js code needed** — the shader and boot animation are complete in the green branch. Agent 5 job is: copy files, change color, write the minimal canvas wrapper, wire IntersectionObserver trigger in Contact.tsx.

---

## File Structure
```
c:\srcs\portfolio-v2\
├── package.json · next.config.ts · tailwind.config.ts
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── providers.tsx         ← Lenis + GSAP init (ScrollTrigger registered once here)
    └── components/
        ├── ScrollProgress.tsx    ← Chapter dots (4 dots, right edge, gold fill)
        ├── LetterboxBars.tsx     ← 10vh → 4vh (desktop) / 2vh (mobile), fixed
        ├── Grain.tsx             ← SVG feTurbulence, seed shifts 100ms
        ├── Hero.tsx              ← Load sequence + hero pin
        ├── ChapterCard.tsx       ← Reusable intertitle component
        ├── Origin.tsx            ← Section 2 — 5 beats
        ├── Projects.tsx          ← Section 3 — 4-frame horizontal scrub
        ├── Timeline.tsx          ← Section 4 — career
        ├── Identity.tsx          ← Section 5 — architect
        ├── Contact.tsx           ← Section 6 — colophon + hologram
        └── HologramCanvas.tsx    ← Minimal R3F canvas (no Bloom/drones/particles)
    ├── shaders/
    │   └── hologram-portrait.glsl.ts   ← copied from green branch, unchanged
    └── lib/
        └── animation-state.ts          ← copied from green branch, unchanged
```

---

## Build Sequence (single sequential build — all breakpoints per component)

> Every component is built mobile → tablet → desktop in one pass.
> Tailwind classes: default = mobile, `md:` = tablet, `xl:` = desktop.
> No responsive clean-up step at the end.

```
Step 1 — Foundation
  git checkout --orphan portfolio-v2 in c:\srcs\Portfolio\
  npx create-next-app@14 . (TypeScript, App Router, Tailwind)
  Install: gsap @gsap/react lenis framer-motion @react-three/fiber @react-three/drei three @types/three
  tailwind.config.ts (theme tokens)
  globals.css (grain, base styles, letterbox class, mobile breakpoints, scrollbar)
  providers.tsx (Lenis init + GSAP + ScrollTrigger registered here only)
  layout.tsx (fonts, metadata, Providers wrapper)
  page.tsx skeleton (imports all components in order)
  LetterboxBars.tsx · Grain.tsx · ScrollProgress.tsx (chapter dots)
  All component stubs (empty section returns)
  Verify npm run build passes.
  ▶ REVIEW: build passes, tokens correct, Lenis+GSAP init correct, no conflicts

Step 2 — Hero + Chapter cards
  Hero.tsx (load sequence + hero pin, all 3 breakpoints)
  ChapterCard.tsx (reusable intertitle)
  ▶ REVIEW: load sequence timings, GSAP pin desktop-only, letterbox compression,
            mobile/tablet static hero, chapter card hard-cut behavior

Step 3 — Projects (3-frame horizontal scrub)
  Projects.tsx (3 frames: Syndicate · Hourglass · HireHouse)
  Desktop: 300vw rail, GSAP scrub + pin
  Tablet: scrub preserved, stacked card layout within each frame
  Mobile: 100vh vertical cards, gold SVG border trace on entry
  Annotation callouts (SVG lines desktop, label list tablet/mobile)
  Bleach bypass filter
  ▶ REVIEW: scrub direction/math, SVG stroke-dashoffset trace, mobile card anatomy,
            annotation callout switching, bleach bypass applied

Step 4 — Origin + Timeline + Identity
  Origin.tsx (IIM-K narrative + 7 clip-path reveals + DSAVisually + Kaggle, all breakpoints)
  Timeline.tsx (career spine + Cappriosec deleted scene — hover desktop, tap mobile/tablet)
  Identity.tsx (pull-quote + adoption statement + credential badges, all breakpoints)
  ▶ REVIEW: clip-path stagger timing, IIM-K quote presentation, Cappriosec hover/tap,
            credential badge slide (desktop) vs fade-up (mobile), year spine visible only desktop

Step 5 — Contact + Hologram + Integration
  Copy hologram files from green branch:
    src/shaders/hologram-portrait.glsl.ts
    src/components/HologramPortrait.tsx  (moved from hero/)
    src/lib/animation-state.ts
    public/br_i.png
  Change uGlowColor to THREE.Color(0.784, 0.663, 0.431)
  HologramCanvas.tsx (minimal R3F, dpr=[1,1.5], no EffectComposer)
  Contact.tsx (colophon + resume download + hologram — desktop right col, tablet below, mobile hidden)
  Wire page.tsx (all components + chapter dot targets)
  npm run build — fix TypeScript/import errors
  ▶ REVIEW: hologram boots on viewport entry, gold color correct, canvas not mounted until inView,
            mobile hides hologram, full build zero errors, scroll story end-to-end coherent
```

### Review Agent Instructions (run after each step)
Each review is a read-only agent. It receives:
1. The plan section for that step (what was supposed to be built)
2. The actual component files written
3. Checks: does the code implement what the plan specifies? Are all 3 breakpoints handled?
   Are animation ownership rules followed (GSAP scroll, Framer Motion entry-only)?
   Any TypeScript errors or missing imports?
Reports: PASS / FAIL with specific line-level issues if FAIL.

---

## Open Items (blocking — needed before build)
- [ ] Hourglass landing page URL
- [ ] HireHouse landing page URL
- [ ] Kaggle profile URL
- [ ] DSA Java GitHub repo URL
- [x] Timeline gap resolved — no gap. SM Technology ran Feb 2022 → May 2024.
- [ ] Drop screenshots: `public/assets/Preview/<project>/SS-1.png`
- [ ] Drop resume: `public/assets/Aadarsh_Resume.pdf`
- [x] Hologram source: green branch (`HologramPortrait.tsx`, `hologram-portrait.glsl.ts`, `animation-state.ts`, `public/br_i.png`)

---

## Verification Checklist
- [ ] Load: black → typewriter → letterbox → hard cut name (Lenis locked, 1s dwell after)
- [ ] Hero: name fills letterbox on scroll, bars compress to 4vh, permanent
- [ ] Chapter dots: 4 right-edge dots track chapter cards
- [ ] All 4 chapter cards: hard-cut in/out, ~80vh pin each
- [ ] Origin: 7 clip-path lines + DSAVisually callout + gap beat + Kaggle + credentials + year spine
- [ ] Projects: 3-frame horizontal (desktop) / stacked (mobile), gold SVG border traces, annotation callouts, bleach bypass
- [ ] Timeline: spine draws ahead of entries, NOW dot pulses gold, Hyperliquid blink, Cappriosec redacted entry hover-reveals on desktop
- [ ] Identity: pull-quote → adoption statement → 3 credential badges (Framer Motion) → gold hairline
- [ ] Contact: "AVAILABLE FOR AMBITIOUS PROBLEMS" · resume download · DUBAI · MMXXVI · hologram materialises on viewport entry (gold, 60% opacity, desktop only)
- [ ] Mobile (<768px): letterbox 2vh, stacked project cards, no SVG spine, no scroll dots, tap-to-reveal Cappriosec, hologram hidden
- [ ] Tablet (768–1279px): letterbox 3vh, horizontal scrub preserved, SVG spine hidden, hologram below text, hover/tap Cappriosec
- [ ] Desktop (≥1280px): full experience — scrub, dots, spine, hologram right column, hover Cappriosec
- [ ] GSAP owns scroll, Framer Motion owns entry fades — no conflicts
- [ ] npm run build zero errors

---

## HERO REDESIGN — Path C (Instanced Sprockets + drei `<Html>`)

**Goal:** Replace current `<ProjectedTitle>` text-on-wall with a cinematic film-strip loop arcing reel-to-reel + falling FLATS-style headline. Reuse existing projector GLB, beam, fog.

**Fallback:** Path A (Pure R3F TubeGeometry) if `<Html>` portals or InstancedMesh flow proves unworkable.

### Architecture
- ONE R3F canvas. Projector + reels + beam + instanced film strip + drei `<Html>` cards + drei `<Html>` headline all share scene graph.
- Existing files untouched: `projector-1k.glb`, `VolumetricBeam.tsx`, `FilmGrain.tsx`, `Fog`, `LightCone`, `LetterboxBars`.
- Removed: `ProjectedTitle` in `ProjectorScene.tsx` (replaced by `<Html>` headline + falling reveal).

### Mechanics
- **Curve**: `CatmullRomCurve3` (centripetal), 5 control pts — Reel001 tangent → 2 arc apex pts above projector → Reel002 tangent → 1 return-loop pt behind projector (closed loop).
- **Strip**: `InstancedMesh`, N=140 desktop / N=60 mobile. Each instance = small plane with sprocket-frame alpha texture. Per-frame matrix update from `curve.getPointAt(t)` + `lookAt(getPointAt(t+ε))`.
- **Flow**: `t_i = ((i / N) + tOffset) % 1`; `tOffset += reelAngularVelocity * dt * k`. Sprockets march continuously, synced to reel spin.
- **In-strip cards**: 2× drei `<Html>` portals anchored to curve at fixed `t` values (~0.35, ~0.6).
  - "Director's Cut" — lavender cursive (Allura webfont), translucent celluloid bg.
  - "The Origin" — coral on cream, masking-tape SVG corners ±8°.
- **Headline**: drei `<Html>` screen-space (`transform: none`), Archivo Black. SplitText per-char (manual `Array.from` split — no GSAP Club dep). Drop `y: -120% → 0`, stagger 40ms, `ease: power4.out`. Container `mask-image: linear-gradient(to bottom, black 55%, transparent 55%)` — hard horizon cut, **held permanently** (FLATS look).
- **Color stance**: gold base everywhere. Lavender + coral are 2 accent hits only (the 2 cards). Keeps portfolio identity.

### Load Choreography
| Time | Event |
|------|-------|
| 0.0s | Projector fades up, reels begin spinning (existing) |
| 0.6s | Curve length tweens 0 → full; instances populate as strip extends |
| 1.4s | Lead instances reach Reel002, "tuck" via scale-down on last 8% of t |
| 1.6s | "Director's Cut" card fades in on strip |
| 1.9s | "The Origin" card "tapes on" — rotate -3°, scale 0.9 → 1 |
| 2.2s | Headline chars drop, stagger settles 0.8s |
| 3.0s | Steady state — continuous flow loop, mask held |

### Build Chunks (each requires user validation before next)
1. **Curve scaffold** — `CatmullRomCurve3` between Reel001/Reel002 world positions. Debug-visualize as `<Line>`. Validate arc shape.
2. **Instanced sprocket strip** — N=140 quads on curve, sprocket alpha texture, no flow. Validate density + look.
3. **Continuous flow** — `tOffset` advances from reel ω. Validate march direction + speed.
4. **Intro draw-in** — strip extends 0 → full on load. Validate threading feel.
5. **In-strip cards** — 2× `<Html>` portals (Director's Cut + The Origin). Validate legibility + tape look.
6. **Falling headline** — `<Html>` SplitText + mask-image FLATS cut. Validate drop timing + cut.
7. **Polish** — projector left-shift, mobile breakpoints, remove old `<ProjectedTitle>`, color audit.

### Risks (and mitigations)
1. `<Html>` `occlude` flickers at curve crossings → depth-bias offset on the portal anchor.
2. CatmullRom overshoot at sharp control points → use `curveType: 'centripetal'`.
3. Allura webfont FOUT → preload via `next/font/google`.

### Fallback Trigger (switch to Path A if)
- `<Html>` cards cannot align stably to spinning curve, OR
- InstancedMesh flow stutters on mid-range mobile, OR
- Mask-image FLATS cut clips DOM headline incorrectly on Safari.
