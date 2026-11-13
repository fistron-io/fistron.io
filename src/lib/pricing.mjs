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
