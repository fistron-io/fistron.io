// The pricing page's table of plans (src/pages/pricing.astro).

/**
 * A tier's price note as the head of the table shows it under the price: the
 * part before the first ";" ("a month, or EUR 144 a year; no commitment"
 * becomes "a month, or EUR 144 a year"), the tier's card has the rest.
 * @param {string} note
 * @returns {string}
 */
export function shortPriceNote(note) {
  return note.split(";")[0].trim();
}

/**
 * Whether a tier's line names something in development: Fištrónek works
 * beside it (the brand's pose "working").
 * @param {string} line
 * @returns {boolean}
 */
export function inDevelopment(line) {
  return /\bin development\b/i.test(line);
}
