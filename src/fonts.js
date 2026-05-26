// Font files for WebGL (troika) text — imported as URLs via Vite's ?url.
// @fontsource ships .woff under files/; troika parses these directly.
//
// Unified 3-tier font system:
//   Anton            → headlines, display titles
//   DM Mono 400      → chrome, labels, metadata, UI
//   Cormorant Garamond (400/italic 400/italic 500) → body, prose, elegance
//
// Chapter-specific prop fonts (exempt from normalization):
//   Courier Prime 700 → Exit Notice postcard typewriter
//   Caveat 600/700    → Exit Notice handwriting / signature
//   (CraftsChapter newspaper uses the Cormorant stack editorially)
import anton from '@fontsource/anton/files/anton-latin-400-normal.woff?url'
import dmMono400 from '@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff?url'
import cormorant from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff?url'
import cormorantItalic from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff?url'
import cormorantItalic500 from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff?url'
import courierPrimeBold from '@fontsource/courier-prime/files/courier-prime-latin-700-normal.woff?url'
import caveat600 from '@fontsource/caveat/files/caveat-latin-600-normal.woff?url'
import caveat700 from '@fontsource/caveat/files/caveat-latin-700-normal.woff?url'

export const FONTS = {
  anton,
  dmMono400,
  cormorant,
  cormorantItalic,
  cormorantItalic500,
  courierPrimeBold,
  caveat600,
  caveat700,
}
