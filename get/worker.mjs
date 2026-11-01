// get.fistron.io (Fistron ADR 0122 point 1): the installer of the newest
// release, `curl -fsSL https://get.fistron.io | sh -s -- agent`. A redirect to
// the release asset install.sh, so what is served is the release's file byte
// for byte; a version in the path (/v1.2.3) gives that release's installer.
// The repository is the Worker's variable REPOSITORY (owner/name).

const VERSION = /^\/v\d+\.\d+\.\d+(?:[-.][0-9A-Za-z.-]+)?$/;

/** Where the installer of `path` is: the newest release's, or a version's; null for anything else. */
export function installer(repository, path) {
  const base = `https://github.com/${repository}/releases`;
  if (path === "/" || path === "/install.sh") return `${base}/latest/download/install.sh`;
  if (VERSION.test(path)) return `${base}/download/${path.slice(1)}/install.sh`;
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Only GET.\n", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const target = installer(env.REPOSITORY, url.pathname);
    if (target === null) {
      return new Response(
        "Fistron's installer: curl -fsSL https://get.fistron.io | sh -s -- --help\n",
        { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
    }
    // never cached here: a new release is served at once
    return new Response(null, { status: 302, headers: { Location: target, "Cache-Control": "no-store" } });
  },
};
