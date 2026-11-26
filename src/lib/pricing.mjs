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

/**
 * A plan's fixed prices in other currencies, by the core's EUR price each stands for
 * (currencies.yaml): "with_model.monthly" names the plan's price.with_model.monthly.
 * @param {{ price?: Record<string, any> | null }} plan the core's plan (plans.json)
 * @param {Record<string, Record<string, number>> | undefined} fixed
 * @returns {Map<number, Record<string, number>>}
 */
export function fixedPrices(plan, fixed) {
  const found = new Map();
  for (const [key, amounts] of Object.entries(fixed ?? {})) {
    const eur = key.split(".").reduce((at, part) => at?.[part], plan.price ?? undefined);
    if (typeof eur === "number") found.set(eur, amounts);
  }
  return found;
}

/**
 * An amount as the site writes it: "USD 3,500".
 * @param {string} currency
 * @param {number} amount
 */
export function money(currency, amount) {
  return `${currency} ${amount.toLocaleString("en", { maximumFractionDigits: 2 })}`;
}

/**
 * What stays in EUR (the model credit, the model pool), with about how much it is in
 * another currency: CZK to the tens, USD to the dollar, or the half dollar under ten.
 * @param {number} eur
 * @param {string} currency
 * @param {number} rate
 */
export function converted(eur, currency, rate) {
  const value = eur * rate;
  const about =
    currency === "CZK" ? Math.round(value / 10) * 10 : value < 10 ? Math.round(value * 2) / 2 : Math.round(value);
  return `${money("EUR", eur)} (about ${money(currency, about)})`;
}

const EUR_AMOUNT = /EUR ([0-9][0-9,]*(?:\.[0-9]+)?)/g;

/**
 * A text's EUR amounts in every currency the page shows: a plan's fixed price where the
 * amount is one, else the amount in EUR with about how much it is.
 * @param {string} text
 * @param {Map<number, Record<string, number>>} fixed
 * @param {Record<string, number>} rates the currencies beside EUR, each per EUR
 * @returns {({ text: string } | Record<string, string>)[]}
 */
export function moneyParts(text, fixed, rates) {
  const parts = [];
  let last = 0;
  for (const found of text.matchAll(EUR_AMOUNT)) {
    if (found.index > last) parts.push({ text: text.slice(last, found.index) });
    const eur = Number(found[1].replaceAll(",", ""));
    const own = fixed.get(eur);
    /** @type {Record<string, string>} */
    const shown = { EUR: found[0] };
    for (const [currency, rate] of Object.entries(rates)) {
      shown[currency] = own?.[currency] !== undefined ? money(currency, own[currency]) : converted(eur, currency, rate);
    }
    parts.push(shown);
    last = found.index + found[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

// the time zones of the United States
const US_ZONES =
  /^(America\/(New_York|Chicago|Denver|Phoenix|Los_Angeles|Anchorage|Juneau|Sitka|Yakutat|Nome|Metlakatla|Adak|Boise|Detroit|Menominee|Indiana\/\w+|Kentucky\/\w+|North_Dakota\/\w+)|Pacific\/Honolulu)$/;

/**
 * The country a visitor most likely is in, by the browser alone (the site asks no server):
 * its time zone when it names one, else its first language's region.
 * @param {{ timeZone?: string; languages?: readonly string[] }} visitor
 * @returns {string | undefined}
 */
export function countryOf(visitor) {
  const zone = visitor.timeZone;
  if (zone) return zone === "Europe/Prague" ? "CZ" : US_ZONES.test(zone) ? "US" : undefined;
  const region = /-([A-Za-z]{2})$/.exec(visitor.languages?.[0] ?? "")?.[1];
  return region?.toUpperCase();
}

/**
 * The currency shown first: the visitor's country's (currencies.yaml), else EUR.
 * @param {{ timeZone?: string; languages?: readonly string[] }} visitor
 * @param {Record<string, string>} countries
 */
export function defaultCurrency(visitor, countries) {
  const country = countryOf(visitor);
  return (country && countries[country]) || "EUR";
}
