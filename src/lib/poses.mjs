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
  // 2026-11-14: Available now, and the GUI's features and moments
  "coffee",
  "redpen",
  "teacher",
  "empty",
  "hourglass",
  "lost",
  "megaphone",
  "juggle",
  "memory",
  "scales",
  "remote",
  "alarm",
  "piggy",
  "suitcase",
  "plane",
  "newspaper",
  "grow",
]);

/** The pose beside everything "In development": he hammers a checkbox not finished yet. */
export const IN_DEVELOPMENT = "working";

/** Its pair beside everything "Available now": he leans on the finished checkbox and sips. */
export const AVAILABLE_NOW = "coffee";

/** The pose of each group of solutions (site.solutionGroups), the same in Fistron's GUI. */
export const GROUP_POSES = /** @type {const} */ ({
  quality: "main",
  compliance: "stamp",
  control: "conductor",
  growth: "telescope",
});
