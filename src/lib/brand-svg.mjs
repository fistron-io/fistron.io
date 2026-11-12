// @ts-check
/**
 * The brand's SVGs and stylesheets (src/brand/, copied unchanged from the
 * fistron-io/brand repository) put inline into a page. The files stay as the
 * brand repository has them; what a page needs is done here, when the site
 * is built:
 *
 * - inlineSvg: the drawing without its <svg> element and <style>, with every
 *   id made unique on the page (a second Flaky must not clip with the first).
 * - scopeCss: the brand's animation classes (.pop, .blink, .st-spin ...) only
 *   inside one element class, and their keyframes renamed, so they never meet
 *   the site's own classes and animations.
 */

/**
 * @param {string} source an SVG file of the brand repository
 * @param {string} prefix makes the ids unique: one per inlined copy
 * @returns {{ viewBox: string, body: string }}
 */
export function inlineSvg(source, prefix) {
  const text = source.trim();
  const open = /^<svg\b([^>]*)>/.exec(text);
  if (!open || !text.endsWith("</svg>")) throw new Error("not an SVG file of the brand");
  const viewBox = /\bviewBox="([^"]+)"/.exec(open[1])?.[1];
  if (!viewBox) throw new Error("an SVG of the brand without a viewBox");
  let body = text.slice(open[0].length, -"</svg>".length).replace(/<style>[\s\S]*?<\/style>/g, "");
  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  for (const id of ids) {
    body = body.replaceAll(`id="${id}"`, `id="${prefix}-${id}"`).replaceAll(`url(#${id})`, `url(#${prefix}-${id})`);
  }
  return { viewBox, body };
}

let made = 0;

/**
 * A prefix for inlineSvg, never the same twice while the site is built, so
 * no two copies on one page share an id.
 * @param {string} name
 */
export function uniqueId(name) {
  made += 1;
  return `${name}-${made}`;
}

/**
 * @param {string} css a stylesheet of the brand repository
 * @param {string} scope a class selector, such as ".fistronek"
 * @returns {string}
 */
export function scopeCss(css, scope) {
  const name = scope.replace(/^\./, "");
  const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
  /** @param {string} text */
  const walk = (text) => {
    let out = "";
    let at = 0;
    for (;;) {
      const brace = text.indexOf("{", at);
      if (brace < 0) break;
      const prelude = text.slice(at, brace).trim();
      let depth = 1;
      let end = brace + 1;
      for (; depth > 0 && end < text.length; end++) {
        if (text[end] === "{") depth++;
        if (text[end] === "}") depth--;
      }
      const inner = text.slice(brace + 1, end - 1);
      if (prelude.startsWith("@keyframes")) {
        out += `@keyframes ${name}-${prelude.split(/\s+/)[1]}{${inner}}`;
      } else if (prelude.startsWith("@")) {
        out += `${prelude}{${walk(inner)}}`;
      } else {
        const selectors = prelude.split(",").map((s) => `${scope} ${s.trim()}`);
        out += `${selectors.join(",")}{${renamed(inner)}}`;
      }
      at = end;
    }
    return out;
  };
  /** @param {string} declarations */
  const renamed = (declarations) =>
    declarations.replace(/(animation(?:-name)?\s*:\s*)([\w-]+)/g, (all, property, value) =>
      keyframes.includes(value) ? `${property}${name}-${value}` : all,
    );
  return walk(css);
}
