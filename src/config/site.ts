/** Site-wide settings: names, URLs and navigation. */

export type ServiceKey = "app" | "docs" | "support" | "openSource";

/** A link inside this site, or one of the separate services. */
export type NavItem = { label: string; href?: string; service?: ServiceKey };

export const site = {
  name: "Fistron",
  url: "https://fistron.io",
  description:
    "Fistron is a Quality Control Plane for software products, infrastructure and IT services. Prove your quality. Keep your tools. Get your time back.",
  slogan: "Prove your quality. Keep your tools. Get your time back.",

  /** Small jokes outside the main story. */
  footerNote: "No flaky tests were harmed in the making of this website. A few were caught.",
  consoleMessage: [
    "Hi, developer. Fištrónek checked this console.",
    "0 errors, 0 warnings, 0 flaky tests.",
    "Your own pipeline? We'd need evidence for that.",
    "Docs are coming soon at docs.fistron.io.",
  ],

  /**
   * Separate services on their own hosts. While `live` is false the site shows
   * the name with "Coming soon" instead of a link. Set it to true once the
   * host is up.
   */
  services: {
    app: { url: "https://app.fistron.io", live: false },
    docs: { url: "https://docs.fistron.io", live: false },
    support: { url: "https://support.fistron.io", live: false },
    openSource: { url: "https://fistron.org", live: false },
  },

  nav: [
    { label: "How it works", href: "/#how" },
    { label: "Use cases", href: "/#use-cases" },
    { label: "Outcomes", href: "/#outcomes" },
    { label: "Platforms", href: "/#platforms" },
    { label: "Deployment", href: "/#deployment" },
    { label: "Open source", service: "openSource" },
    { label: "Docs", service: "docs" },
  ] as NavItem[],

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
