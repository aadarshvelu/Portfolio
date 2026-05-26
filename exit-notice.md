# Exit Notice — Postcard

The final scene of the portfolio. After the newspaper chapter ("The Cutting Room"), the camera arrives at a handwritten postcard — three Courier-bold statements on aged cardstock, marked up in red pen, signed in the corner.

---

## Goals

1. **Identical narrative on every breakpoint.** Same sequence, same pacing, same reveal timing, same reading experience.
2. **Chapter isolation.** Once the postcard scene begins, no newspaper content shows through. Once it ends (reverse scroll), newspaper returns smoothly.
3. **Camera-aligned, not paper-local.** The postcard is positioned in viewport space (sibling of `paperGroup`, not child). It auto-sizes to the live viewport at each breakpoint. No paper transform interference.
4. **Per-breakpoint layouts are dedicated**, not scaled desktop coordinates.
5. **Reverse scroll is deterministic** — every opacity ramp is a pure function of `p`, no remounts, no pops.

---

## Scroll phases (chapter-local `p`)

`p ∈ [0, 1]` where 0 = PEEL_END, 1 = end of scroll runway.

| `p` range     | Phase    | What's visible                                       |
| ------------- | -------- | ---------------------------------------------------- |
| 0.00 → 0.80   | Newspaper| Stories 1, 2, 3, colophon                            |
| 0.80 → 0.84   | Mask-in  | Backdrop fades 0 → 1, newspaper hidden               |
| 0.84 → 0.95   | Reveal   | Cardstock + content dolly + fade in (staggered)      |
| 0.95 → 1.00   | Hold     | Fully readable                                       |

Camera does NOT need to dolly to the postcard area (it stays parked on Story 3). The "dolly feel" is produced by the card root group scaling from 0.92 → 1.00 while opacity ramps 0 → 1.

---

## Component split

Two named exports from `ExitNoticeChapter.jsx`:

- **`ExitNoticeBackdrop`** — full-viewport cream plane. Masks newspaper. Sits at `renderOrder = ORDER.nextChapter + 1.5` (above newspaper text, below cardstock).
- **`ExitNoticeChapter`** (default) — cardstock + content. Sits at `renderOrder = ORDER.nextChapter + 10` and above.

Both are mounted as siblings of `paperGroup` inside `CraftsChapter`. Both are viewport-aligned (live size derived from `camera.fov` + `peelDist`).

---

## Per-breakpoint layout

All fractions of `cardW` (which is set to a fraction of the live viewport width).

| Knob              | desktop  | tablet   | mobile   | Notes                                |
| ----------------- | -------- | -------- | -------- | ------------------------------------ |
| `cardWFrac`       | 0.58     | 0.86     | 0.94     | card width / viewport width          |
| `cardAspect`      | 2/3      | 1.0      | 1.3      | cardH / cardW                         |
| `padFrac`         | 0.085    | 0.075    | 0.065    | inner horizontal padding              |
| `fontHeaderMul`   | 0.025    | 0.024    | 0.024    | header font size / cardW              |
| `fontBodyMul`     | 0.040    | 0.040    | 0.040    | body Courier line (must fit 28 chars) |
| `fontNoteMul`     | 0.036    | 0.034    | 0.034    | handwritten note                      |
| `fontSigMul`      | 0.068    | 0.060    | 0.058    | signature                             |
| `lineGapMul`      | 2.5      | 3.2      | 3.8      | gap between body lines / fontBody     |
| `headerMarginMul` | 2.5      | 2.8      | 3.0      | header inset from top / fontHeader    |
| `sigMarginMul`    | 1.6      | 2.0      | 2.2      | signature inset from bottom / fontSig |
| `rotationDeg`     | -0.5     | -0.4     | -0.3     | slight cardstock tilt                 |

Per-bp body fits the 28-char Courier line cleanly because:
- `inner_width = cardW * (1 - 2 * padFrac)`
- `chW = fontBodyMul * cardW * 0.604` (Courier monospace ratio)
- `28 * chW < inner_width` for all bp values above.

---

## Card-local coordinate system

Card root `<group>` is centered at viewport (0, 0) and scaled to `cardW` world units. Inside this group, everything is in card-local units where `cardW = 1.0` (so positions are fractions of card width).

```
        +cardH/2 (top edge)
   ┌──────────────────────────────────────┐
   │  A Note · For the Record   Filed by ·  │ header   (y = headerY)
   │  ────────────────────────────────────  │ rule     (y = ruleY)
   │                                        │
   │   AI helped me write the code.         │ line1    (y = +lineGap)
   │           wavy underline below "code." │
   │                                        │
   │   The creativity is mine.              │ line2    (y =  0)
   │     ⟲ circle around "creativity"       │
   │           note "always was. ↘"         │
   │                                        │
   │   So is the intelligence.              │ line3    (y = -lineGap)
   │           ⟲ circle around the word     │
   │                                        │
   │                       Aadarsh Velu     │ sigName  (y = sigY)
   │                       ~~~~~~~~~~~      │ swoosh
   │                         — May '26      │ sigDate
   └──────────────────────────────────────┘
        -cardH/2 (bottom edge)
   leftX = -0.5 + padFrac
                              rightX = +0.5 - padFrac
```

### Position formulas

| Element      | x                                 | y                                       |
| ------------ | --------------------------------- | --------------------------------------- |
| headerL      | `leftX`                           | `headerY`                               |
| headerG      | `leftX + 9 * chHeader`            | `headerY`                               |
| headerR      | `rightX` (anchorX: right)         | `headerY`                               |
| rule         | `leftX` → `rightX`                | `ruleY = headerY - 1.4 * fontHeader`    |
| line1        | `leftX`                           | `+lineGap`                              |
| line2        | `leftX`                           | `0`                                     |
| line3        | `leftX`                           | `-lineGap`                              |
| wavy         | start `leftX + 23 * chBody`       | `+lineGap - 0.6 * fontBody`             |
| cCircle      | center `leftX + 9 * chBody`       | `0` (line2)                             |
| iCircle      | center `leftX + 16 * chBody`      | `-lineGap` (line3)                      |
| note         | `leftX + 16 * chBody`             | `+0.45 * fontBody` (just above line 2)  |
| sigName      | `rightX` (anchorX: right)         | `sigY`                                  |
| swoosh       | extends left from `rightX`        | `sigY - 0.72 * fontSig`                 |
| sigDate      | `rightX` (anchorX: right)         | `sigY - 1.40 * fontSig`                 |

Where:
- `chHeader = fontHeader * 0.604 * (1 + letterSpacing)`
- `chBody = fontBody * 0.604`
- `headerY = +cardH/2 - headerMarginMul * fontHeader`
- `lineGap = lineGapMul * fontBody`
- `sigY = -cardH/2 + sigMarginMul * fontSig`

---

## Reveal animation

`exitT = clamp01((p - EXIT_ENTER_P) / (EXIT_LAND_P - EXIT_ENTER_P))`

with `EXIT_ENTER_P = 0.80`, `EXIT_LAND_P = 0.95`.

| Element       | Driver                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| Backdrop alpha| `smoothstep(clamp01(exitT / 0.25))` — fully opaque by `exitT = 0.25`  |
| Card scale    | `0.92 + 0.08 * smoothstep(exitT)` — 0.92 → 1.0                         |
| Cardstock alpha| `smoothstep(exitT)`                                                   |
| Text (header + 3 lines + rule)| `smoothstep(clamp01((exitT - 0.10) / 0.40))`           |
| Circles + wavy| `smoothstep(clamp01((exitT - 0.30) / 0.35))`                          |
| Note          | `smoothstep(clamp01((exitT - 0.45) / 0.35))`                          |
| Signature     | `smoothstep(clamp01((exitT - 0.55) / 0.35))`                          |

Reverse scroll runs every formula backward symmetrically — pure functions, no state.

---

## Render order

| Layer                      | renderOrder           |
| -------------------------- | --------------------- |
| Newspaper paper            | 72 (ORDER.nextChapter)|
| Newspaper text             | 73                    |
| Newspaper DimOverlay       | 74                    |
| **Backdrop**               | **73.5**              |
| **Cardstock**              | **82**                |
| **Card text + rule**       | **83**                |
| **Card marks + sig + note**| **84**                |

The wide gap between backdrop and cardstock (73.5 → 82) is intentional — three.js's transparent depth sort can flip same-renderOrder objects, so we keep a clear separation.

---

## What's NOT in the spec

- Per-bp character-level offsets (`L.headerL.dx`, etc.). All previous hand-tuned shifts are dropped; the new layout math is supposed to land correctly without nudges. If a glyph ends up off, the fix is to adjust the per-bp `fontMul` / `padFrac` / `lineGapMul`, not add character offsets.
- Camera-driven dolly to the postcard area. The camera stays parked on Story 3 (`cy.story3`). The dolly feel comes from card scale 0.92 → 1.0.
- No `LAYOUT_CONFIG` knob for "wavy.dx" etc. — geometry is purely derived from font and char count.
