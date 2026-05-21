// Font files for WebGL (troika) text — imported as URLs via Vite's ?url.
// @fontsource ships .woff under files/; troika parses these directly.
import anton from '@fontsource/anton/files/anton-latin-400-normal.woff?url'
import dmMono400 from '@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff?url'
import cormorantItalic from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff?url'
import cormorantItalic500 from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff?url'

export const FONTS = {
  anton,
  dmMono400,
  cormorantItalic,
  cormorantItalic500,
}
