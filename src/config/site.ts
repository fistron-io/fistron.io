/** Site-wide settings: names, URLs and navigation. */
export const site = {
  name: "Fistron",
  url: "https://fistron.io",
  description:
    "Fistron helps you achieve the quality your software and IT services require, and prove it, by orchestrating the tools you already own.",
  slogan: "Don't replace anything. Orchestrate everything.",

  /** Separate services on their own hosts. */
  links: {
    app: "https://app.fistron.io",
    docs: "https://docs.fistron.io",
    support: "https://support.fistron.io",
    openSource: "https://fistron.org",
  },

  nav: [
    { label: "How it works", href: "/#how" },
    { label: "Use cases", href: "/#use-cases" },
    { label: "Trust", href: "/#trust" },
    { label: "Deployment", href: "/#deployment" },
    { label: "Open source", href: "https://fistron.org" },
    { label: "Docs", href: "https://docs.fistron.io" },
  ],

  /**
   * Search engines may index the site only when PUBLIC_INDEXABLE=true at
   * build time. Default: not indexable, the site is private until launch.
   */
  indexable: import.meta.env.PUBLIC_INDEXABLE === "true",

  /**
   * Endpoint that receives "Request a demo" submissions. Not connected yet:
   * while undefined, the form says so instead of sending anything.
   */
  demoFormAction: undefined as string | undefined,
};
