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

const questions = defineCollection({
  loader: orderedList("questions"),
  schema: z.object({ order, question: z.string(), answer: z.string(), status }),
});

const integrations = defineCollection({
  loader: orderedList("integrations"),
  schema: z.object({ order, name: z.string(), status }),
});

const roadmap = defineCollection({
  loader: orderedList("roadmap"),
  schema: z.object({ order, stage: z.string(), title: z.string(), current: z.boolean().default(false) }),
});

export const collections = {
  sections,
  objective,
  problems,
  steps,
  trust,
  governance,
  deployment,
  audiences,
  questions,
  integrations,
  roadmap,
};
