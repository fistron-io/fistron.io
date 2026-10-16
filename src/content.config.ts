import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";
import { parse } from "yaml";

/**
 * Homepage copy lives in YAML under src/content/<locale>/ so it can be edited
 * without touching layout. English is the only locale for now.
 */
const dir = "src/content/en";

/**
 * Loads a YAML list and keeps the order of the file: the content store sorts
 * entries by id, so each item gets its position as `order`.
 */
function orderedList(name: string) {
  return file(`${dir}/${name}.yaml`, {
    parser: (text) =>
      (parse(text) as Record<string, unknown>[]).map((item, order) => ({ ...item, order })),
  });
}

/** Every feature shown on the site is either available now or in development. */
const status = z.enum(["available", "in-development"]);

const sections = defineCollection({
  loader: file(`${dir}/sections.yaml`),
  schema: z.object({
    title: z.string(),
    intro: z.string().optional(),
    paragraphs: z.array(z.string()).optional(),
    note: z.string().optional(),
    caption: z.string().optional(),
    primaryCta: z.string().optional(),
    secondaryCta: z.string().optional(),
    linkLabel: z.string().optional(),
    quip: z.string().optional(),
    faxLabel: z.string().optional(),
    faxJoke: z.string().optional(),
    successLabel: z.string().optional(),
    successTitle: z.string().optional(),
    successText: z.string().optional(),
    errorText: z.string().optional(),
  }),
});

const objective = defineCollection({
  loader: file(`${dir}/objective.yaml`),
  schema: z.object({
    context: z.string(),
    objective: z.string(),
    requirements: z.array(
      z.object({
        title: z.string(),
        detail: z.string(),
        tool: z.string(),
        supported: z.boolean(),
      }),
    ),
    summary: z.string(),
    state: z.string(),
  }),
});

/** Position in the YAML file, added by orderedList. */
const order = z.number();

const simpleItem = z.object({
  order,
  title: z.string(),
  text: z.string(),
});

const problems = defineCollection({ loader: orderedList("problems"), schema: simpleItem });
const steps = defineCollection({ loader: orderedList("steps"), schema: simpleItem });
const trust = defineCollection({ loader: orderedList("trust"), schema: simpleItem });
const governance = defineCollection({ loader: orderedList("governance"), schema: simpleItem });
const deployment = defineCollection({ loader: orderedList("deployment"), schema: simpleItem });

const audiences = defineCollection({
  loader: orderedList("audiences"),
  schema: simpleItem.extend({ example: z.string() }),
});

const outcomes = defineCollection({
  loader: orderedList("outcomes"),
  schema: simpleItem.extend({ label: z.string() }),
});

const messages = defineCollection({
  loader: orderedList("messages"),
  schema: z.object({ order, title: z.string(), lines: z.array(z.string()).min(1) }),
});

const signals = defineCollection({
  loader: orderedList("signals"),
  schema: z.object({ order, value: z.string(), text: z.string(), source: z.string(), url: z.string().url() }),
});

const partnerModels = defineCollection({
  loader: orderedList("partner-models"),
  schema: simpleItem.extend({ label: z.string() }),
});

const engagement = defineCollection({ loader: orderedList("engagement"), schema: simpleItem });
const guarantees = defineCollection({ loader: orderedList("guarantees"), schema: simpleItem });
const included = defineCollection({ loader: orderedList("included"), schema: simpleItem });

const questions = defineCollection({
  loader: orderedList("questions"),
  schema: z.object({ order, question: z.string(), answer: z.string(), status }),
});

const integrations = defineCollection({
  loader: orderedList("integrations"),
  schema: z.object({ order, name: z.string(), status }),
});

const platforms = defineCollection({
  loader: orderedList("platforms"),
  schema: z.object({
    order,
    name: z.string(),
    logo: z.string().regex(/^[a-z0-9-]+$/),
    support: z.enum(["available", "limited", "candidate"]),
    label: z.string(),
    detail: z.string(),
    featured: z.boolean().default(false),
  }),
});

const roadmap = defineCollection({
  loader: orderedList("roadmap"),
  schema: z.object({
    order,
    stage: z.string(),
    // implemented: filled checkbox; in-development: empty checkbox; planned: no checkbox
    status: z.enum(["implemented", "in-development", "planned"]).default("planned"),
    title: z.string(),
    detail: z.string(),
    current: z.boolean().default(false),
  }),
});

const dogfood = defineCollection({
  loader: orderedList("dogfood"),
  schema: z.object({ order, when: z.string(), text: z.string() }),
});

/** Figures stay as measured; see the comment in dogfood-stats.yaml. */
const dogfoodStats = defineCollection({
  loader: orderedList("dogfood-stats"),
  schema: z.object({ order, value: z.string(), text: z.string() }),
});

export const collections = {
  dogfood,
  dogfoodStats,
  sections,
  objective,
  problems,
  steps,
  trust,
  governance,
  deployment,
  audiences,
  outcomes,
  messages,
  engagement,
  guarantees,
  included,
  signals,
  partnerModels,
  questions,
  integrations,
  platforms,
  roadmap,
};
