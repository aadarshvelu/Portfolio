// Per-breakpoint hero layout. World units = design pixels of the active
// breakpoint; origin at screen centre, +x right, +y up.
//
// `desktop` values are the live, hand-tuned production layout — do not change
// them without intent. `tablet` / `mobile` are portrait layouts; their values
// are starting points, tune on a device.

export const LAYOUTS = {
  desktop: {
    design: { w: 1920, h: 1080 },
    starfield: { count: 180 },
    shootingStar: { count: 7, len: 120, thick: 2.4 },
    moon: { x: 750, y: 333.6, w: 560 },
    clouds: { x: 690, y: 300, scale: .6 },
    title: { x: 0, y: 270, w: 1150 },
    filmRoll: { y: -135, scale: .95, rise: 900, spread: 16, visibleFrames: 5 },
    // Carousel prev/next controls, flanking the reel (world units from centre).
    arrows: { x: 844, y: -150 },
    chrome: {
      cornerX: 900,
      topY: 412,
      bottomY: -384,
      regX: 928,
      regY: 404,
      fontScale: 1,
      shortMeta: false,
    },
    scrollPrompt: { y: -486 },
    bootLine: { fontSize: 14 },
    // Phase A — camera parks the FIRST LIGHT frame. Scene computes the exact
    // dolly target from the live viewport so the frame can never overshoot
    // off-screen. 'left' = frame pinned left at heightFrac of viewport height,
    // its content sideMargin in from the left edge.
    park: { mode: 'left', heightFrac: 0.78, sideMargin: 0.055 },
    // Phase B — Beat 1 text column scrolls up the right lane. lane{Top,Bot}
    // are viewport-height fractions (0 = top edge); full height on desktop.
    originBeat: {
      x: 143,
      fontSize: 15,
      gap: 22,
      maxWidth: 195,
      anchorX: 'left',
      laneTop: 0.05,
      laneBot: 0.95,
    },
    // Confetti celebration scale (relative to desktop) + reel-transition card.
    confetti: { scale: 1 },
    reel: { titleSize: 17, emSize: 8.5, labelSize: 4.6, mode: 'corners' },
    // Act I.b — The Upgrade
    upgrade: {
      design: { w: 1920, h: 1080 },
      starCount: 60,
      // title slate
      aboveSize: 11, titleSize: 120, subSize: 30, cornerSize: 10,
      // clapperboard
      clapX: -680, clapY: 240, clapScale: 1,
      // polaroid positions (world units from Upgrade scene centre)
      shootingStar: { count: 5, len: 100, thick: 2.0 },
      polaroidW: 140, photoAspect: 1,
      kaggle:    { x: 480, y: -260, rot: -4 },
      kozhikode: { x: 660, y: -180, rot: 6 },
      aws:       { x: 540, y: -50, rot: 6, scale: 0.78 },
      // camera park per polaroid — fillFrac = how much of viewport height
      // the polaroid fills when the camera is parked on it
      kagglePark:    { fillFrac: 0.7 },
      kozhikodePark: { fillFrac: 0.7 },
      awsPark:       { fillFrac: 0.6 },
      // chrome
      chrome: {
        cornerX: 900, topY: 412, bottomY: -384,
        regX: 928, regY: 404, fontScale: 1,
      },
    },
    // titleSize/subSize: world units sized to fit within the ~176-unit wide
    // viewport at peelDist=150, fov~36°. titleY/subY: vertical offsets.
    peel: {
      curlRadiusFrac: 0.08, peelDist: 150, overscan: 1.05,
      titleSize: 18, subSize: 6, titleY: 12, subY: -12,
      // The Roster (Chapter III) reel-road. k = type/HUD scale (fonts + row
      // spacing ×k); seg/amp/roadY = wave geometry; beacon = reel size ×;
      // stars = backdrop star count. Portrait bumps k/amp/beacon so the
      // width-relative layout stays legible on a narrow screen.
      roster: { k: 1.0, seg: 26, amp: 5, roadY: 6, beacon: 1.0, stars: 70 },
      // The Crafts chapter — desktop landscape: two-column layout (figure left,
      // prose right). All positions in paper-local design units (1 du = 1% of
      // paper width). Paper is 100du × paperH; +y up, x centred at 0.
      crafts: {
        paperH: 260,
        stacked: false,
        s: { wide: 0.78, open: 0.82, park: 1.05, turn: 0.84, pullout: 0.55, postcard: 2.05 },
        cy: { story1: 62, story2: 118, story3: 175, turn12: 90, turn23: 146, postcard: 235 },
        ruleY: { r12: 40, r23: -15 },
        colophonY: -76,
        dim: [
          { y: 69, h: 52 },
          { y: 12, h: 52 },
          { y: -45, h: 56 },
        ],
        size: {
          title: 9.5, tagline: 2.1, mastheadStrap: 0.68,
          sectionRule: 0.72, colophon: 0.7,
          kicker: 0.7, headline: 8.0, headlineMaxW: 92,
          deck: 1.75, deckMaxW: 88,
          body: 1.18, bodyMaxW: 48,
          pull: 1.4, pullMaxW: 46,
          meta: 0.66, figLabel: 0.6,
        },
        // Per-story absolute Y positions (du) for all elements.
        stories: [
          { kickerY: 93, headlineY: 84, deckY: 79,
            figureX: -22, figureY: 64, figureW: 36, figureH: 24,
            bodyX: 2, bodyY: 76, pullX: 3, pullY: 52,
            outcomeY: 46.5, staffY: 44,
            goldHeadlineX: -17, goldBodyY: 57, goldPullX: 3 },
          { kickerY: 37, headlineY: 28, deckY: 23.5,
            figureX: -22, figureY: 8, figureW: 36, figureH: 22,
            bodyX: 2, bodyY: 20, pullX: 3, pullY: -3,
            outcomeY: -8.5, staffY: -11,
            goldHeadlineX: 13, goldBodyY: 5, goldPullX: 3 },
          { kickerY: -17.5, headlineY: -26, deckY: -31,
            figureX: -22, figureY: -47, figureW: 36, figureH: 22,
            bodyX: 2, bodyY: -35, pullX: 3, pullY: -61,
            outcomeY: -67, staffY: -69.5,
            goldHeadlineX: -15, goldBodyY: -53, goldPullX: 3 },
        ],
      },
    },
  },

  tablet: {
    design: { w: 820, h: 1180 },
    starfield: { count: 130 },
    shootingStar: { count: 5, len: 70, thick: 2.0 },
    moon: { x: 380, y: 250, w: 560 },
    clouds: { x: 300, y: 200, scale: 0.6 },
    title: { x: 10, y: 125, w: 1275 },
    filmRoll: { y: -180, scale: 0.92, rise: 520, spread: 16, visibleFrames: 5 },
    arrows: { x: 300, y: -275 },
    chrome: {
      cornerX: 352,
      topY: 540,
      bottomY: -500,
      regX: 388,
      regY: 530,
      fontScale: 0.92,
      shortMeta: false,
    },
    scrollPrompt: { y: -420 },
    bootLine: { fontSize: 16 },
    // Portrait — 'top' pins the frame to the top at widthFrac of viewport
    // width, topMargin in from the top edge; Beat 1 scrolls up the lower band.
    park: { mode: 'top', widthFrac: 0.84, topMargin: 0.05 },
    originBeat: {
      x: 0,
      fontSize: 28,
      gap: 24,
      maxWidth: 250,
      anchorX: 'center',
      laneTop: 0.54,
      laneBot: 0.97,
    },
    confetti: { scale: 1.8 },
    reel: { titleSize: 9, emSize: 6, labelSize: 4, mode: 'stack' },
    upgrade: {
      design: { w: 820, h: 1180 },
      starCount: 40,
      aboveSize: 10, titleSize: 80, subSize: 24, cornerSize: 9,
      titleX: 5, titleY: 250,
      clapX: -270, clapY: 140, clapScale: 0.8,
      shootingStar: { count: 4, len: 60, thick: 1.6 },
      polaroidW: 120, photoAspect: 1,
      kaggle:    { x: 20,  y: 10,  rot: -5 },
      kozhikode: { x: -120, y: -160, rot: 6 },
      aws:       { x: 50,  y: -150, rot: -3, scale: 0.78 },
      kagglePark:    { fillFrac: 0.55 },
      kozhikodePark: { fillFrac: 0.55 },
      awsPark:       { fillFrac: 0.48 },
      chrome: {
        cornerX: 370, topY: 550, bottomY: -540,
        regX: 390, regY: 540, fontScale: 0.92,
      },
    },
    // ~73-unit wide viewport at peelDist=150 on tablet portrait
    peel: {
      curlRadiusFrac: 0.08, peelDist: 150, overscan: 1.05,
      titleSize: 8, subSize: 2.8, titleY: 6, subY: -6,
      roster: { k: 1.5, seg: 30, amp: 9, roadY: 4, beacon: 1.4, stars: 90 },
      // Tablet portrait — stacked layout: figure above body, both centred.
      // Paper extended to 300du (vs 260 desktop) so taller stacked articles
      // fit. Higher s_park because portrait viewport is taller than wide.
      crafts: {
        paperH: 300,
        stacked: true,
        s: { wide: 1.4, open: 1.5, park: 2.0, turn: 1.55, pullout: 0.55, postcard: 2.40 },
        cy: { story1: 78, story2: 150, story3: 229, turn12: 114, turn23: 190, postcard: 280 },
        ruleY: { r12: 29, r23: -43 },
        colophonY: -130,
        dim: [
          { y: 72, h: 78 },
          { y: 0,  h: 78 },
          { y: -86, h: 82 },
        ],
        size: {
          title: 8.5, tagline: 1.85, mastheadStrap: 0.95,
          sectionRule: 1.05, colophon: 1.0,
          kicker: 1.0, headline: 5.4, headlineMaxW: 70,
          deck: 1.55, deckMaxW: 70,
          body: 1.35, bodyMaxW: 70,
          pull: 1.7, pullMaxW: 70,
          meta: 0.95, figLabel: 0.88,
        },
        stories: [
          { kickerY: 108, headlineY: 100, deckY: 90,
            figureX: 0, figureY: 75, figureW: 38, figureH: 18,
            bodyX: 0, bodyY: 62, pullX: 0, pullY: 44,
            outcomeY: 39, staffY: 36,
            goldHeadlineX: 0, goldBodyY: 55, goldPullX: 0 },
          { kickerY: 36, headlineY: 28, deckY: 18,
            figureX: 0, figureY: 3, figureW: 38, figureH: 18,
            bodyX: 0, bodyY: -10, pullX: 0, pullY: -28,
            outcomeY: -33, staffY: -36,
            goldHeadlineX: 0, goldBodyY: -17, goldPullX: 0 },
          { kickerY: -50, headlineY: -58, deckY: -68,
            figureX: 0, figureY: -83, figureW: 38, figureH: 18,
            bodyX: 0, bodyY: -96, pullX: 0, pullY: -114,
            outcomeY: -119, staffY: -122,
            goldHeadlineX: 0, goldBodyY: -103, goldPullX: 0 },
        ],
      },
    },
  },

  mobile: {
    design: { w: 430, h: 930 },
    starfield: { count: 85 },
    shootingStar: { count: 4, len: 44, thick: 1.8 },
    moon: { x: 185, y: 150, w: 532 },
    clouds: { x: 20, y: 90, scale: 0.3 },
    title: { x: 5, y: 110, w: 900 },
    filmRoll: { y: -160, scale: 0.75, rise: 420, spread: 6, visibleFrames: 3 },
    arrows: { x: 150, y: -150 },
    chrome: {
      cornerX: 188,
      topY: 422,
      bottomY: -388,
      regX: 205,
      regY: 410,
      fontScale: 0.78,
      shortMeta: true,
    },
    scrollPrompt: { y: -320 },
    bootLine: { fontSize: 11 },
    // Portrait — 'top' pins the frame to the top at widthFrac of viewport
    // width, topMargin in from the top edge; Beat 1 scrolls up the lower band.
    park: { mode: 'top', widthFrac: 0.9, topMargin: 0.04 },
    originBeat: {
      x: 0,
      fontSize: 26,
      gap: 22,
      maxWidth: 195,
      anchorX: 'center',
      laneTop: 0.4,
      laneBot: 0.97,
    },
    confetti: { scale: 1.8 },
    reel: { titleSize: 6, emSize: 4, labelSize: 2.8, mode: 'stack' },
    upgrade: {
      design: { w: 430, h: 930 },
      starCount: 30,
      aboveSize: 9, titleSize: 56, subSize: 20, cornerSize: 8,
      titleX: 5, titleY: 125,
      clapX: -120, clapY: 130, clapScale: 0.4,
      shootingStar: { count: 3, len: 36, thick: 1.4 },
      polaroidW: 100, photoAspect: 1,
      kaggle:    { x: 80,  y: -30,   rot: -14 },
      kozhikode: { x: -80, y: -100, rot: 5 },
      aws:       { x: 40,  y: -160, rot: -3, scale: 0.78 },
      kagglePark:    { fillFrac: 0.5 },
      kozhikodePark: { fillFrac: 0.5 },
      awsPark:       { fillFrac: 0.44 },
      chrome: {
        cornerX: 195, topY: 440, bottomY: -420,
        regX: 208, regY: 430, fontScale: 0.78,
      },
    },
    // ~38-unit wide viewport at peelDist=150 on mobile portrait
    peel: {
      curlRadiusFrac: 0.08, peelDist: 150, overscan: 1.05,
      titleSize: 4.5, subSize: 1.6, titleY: 3, subY: -3,
      roster: { k: 1.95, seg: 32, amp: 12, roadY: 3, beacon: 1.65, stars: 90 },
      // Mobile portrait — narrowest column. Stacked, larger relative font
      // sizes for legibility. Paper extended to 300du; positions match the
      // tablet portrait so the layout reads the same shape on every
      // portrait device. Only fonts and camera scales differ.
      crafts: {
        paperH: 300,
        stacked: true,
        s: { wide: 1.55, open: 1.65, park: 2.18, turn: 1.7, pullout: 0.78, postcard: 3.05 },
        cy: { story1: 78, story2: 150, story3: 229, turn12: 114, turn23: 190, postcard: 280 },
        ruleY: { r12: 29, r23: -43 },
        colophonY: -130,
        dim: [
          { y: 72, h: 78 },
          { y: 0,  h: 78 },
          { y: -86, h: 82 },
        ],
        size: {
          title: 7.0, tagline: 1.5, mastheadStrap: 1.15,
          sectionRule: 1.25, colophon: 1.15,
          kicker: 1.2, headline: 4.5, headlineMaxW: 38,
          deck: 1.45, deckMaxW: 38,
          body: 1.55, bodyMaxW: 38,
          pull: 1.75, pullMaxW: 38,
          meta: 1.15, figLabel: 0.95,
        },
        stories: [
          { kickerY: 108, headlineY: 100, deckY: 90,
            figureX: 0, figureY: 75, figureW: 32, figureH: 16,
            bodyX: 0, bodyY: 62, pullX: 0, pullY: 44,
            outcomeY: 39, staffY: 36,
            goldHeadlineX: 0, goldBodyY: 55, goldPullX: 0 },
          { kickerY: 36, headlineY: 28, deckY: 18,
            figureX: 0, figureY: 3, figureW: 32, figureH: 16,
            bodyX: 0, bodyY: -10, pullX: 0, pullY: -28,
            outcomeY: -33, staffY: -36,
            goldHeadlineX: 0, goldBodyY: -17, goldPullX: 0 },
          { kickerY: -50, headlineY: -58, deckY: -68,
            figureX: 0, figureY: -83, figureW: 32, figureH: 16,
            bodyX: 0, bodyY: -96, pullX: 0, pullY: -114,
            outcomeY: -119, staffY: -122,
            goldHeadlineX: 0, goldBodyY: -103, goldPullX: 0 },
        ],
      },
    },
  },
}
