import { getCollection, getEntry, type CollectionEntry, type CollectionKey } from "astro:content";

/** One section's copy from sections.yaml; fails the build if the key is missing. */
export async function section(id: string) {
  const entry = await getEntry("sections", id);
  if (!entry) throw new Error(`sections.yaml has no entry "${id}"`);
  return entry.data;
}

type ListKey = Exclude<CollectionKey, "sections" | "objective">;

/** All items of a list collection, in the order they appear in the YAML file. */
export async function list<C extends ListKey>(name: C): Promise<CollectionEntry<C>["data"][]> {
  const entries = await getCollection(name);
  return entries
    .map((entry) => entry.data as CollectionEntry<C>["data"])
    .sort((a, b) => a.order - b.order);
}

/** As `list`, each item with its `id` from the YAML file (for links and lookups). */
export async function listWithIds<C extends ListKey>(
  name: C,
): Promise<(CollectionEntry<C>["data"] & { id: string })[]> {
  const entries = await getCollection(name);
  return entries
    .map((entry) => ({ ...(entry.data as CollectionEntry<C>["data"]), id: entry.id }))
    .sort((a, b) => a.order - b.order);
}
