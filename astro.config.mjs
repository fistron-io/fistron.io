// @ts-check
import { defineConfig } from "astro/config";

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: "https://fistron.io",
  // Static HTML only: no server, works on any static host.
  output: "static",
  // English only for now; add locales here when translations arrive.
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
});
