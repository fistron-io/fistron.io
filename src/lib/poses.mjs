// Fištrónek's poses, as the brand repository has them (src/brand/mascot/),
// and which one illustrates what on the website.

/** Every pose of the brand, in the brand's order. */
export const POSES = /** @type {const} */ ([
  "main",
  "investigating",
  "skeptical",
  "chase",
  "telescope",
  "broom",
  "stamp",
  "conductor",
  "chef",
  "desk",
  "quarantine",
  "working",
  "lightbulb",
  "cloud",
  "abacus",
  "journey",
  "clipboard",
]);

/** The pose beside everything "In development": he hammers a checkbox not finished yet. */
export const IN_DEVELOPMENT = "working";

/** The pose of each group of solutions (site.solutionGroups), the same in Fistron's GUI. */
export const GROUP_POSES = /** @type {const} */ ({
  quality: "main",
  compliance: "stamp",
  control: "conductor",
  growth: "telescope",
});
