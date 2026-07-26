/**
 * sanitizeText — normalize any string before it is rendered with <Text>, so no
 * unsupported glyph ever falls back to a placeholder square.
 *
 * Strips carriage returns, zero-width spaces, converts non-breaking spaces to
 * regular spaces, removes any remaining non-ASCII (em dashes, block glyphs,
 * etc.), and trims. The default font reliably contains every standard ASCII
 * glyph, so the result is always renderable.
 */
export function sanitizeText(text) {
  return String(text)
    .replace(/\r/g, "")
    .replace(/​/g, "")
    .replace(/ /g, " ")
    .replace(/[^\x00-\x7F]/g, "")
    .trim();
}
