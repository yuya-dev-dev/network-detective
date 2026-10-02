import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { join, extname } from "node:path";
export async function pwaServer() {
  const assets = new Map<string, Buffer>();
  async function collect(dir: string, prefix = "") {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const name = `${prefix}${entry.name}`;
      if (entry.isDirectory()) await collect(join(dir, entry.name), `${name}/`);
      else assets.set(name, await readFile(join(dir, entry.name)));
    }
  }
  await collect("dist");
  let generation = 1;
  const mime: Record<string, string> = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".webmanifest": "application/manifest+json",
    ".webp": "image/webp",
    ".png": "image/png",
  };
  const server = createServer((req, res) => {
    const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
    if (!pathname.startsWith("/game/")) {
      res.writeHead(404).end();
      return;
    }
    const name = pathname.slice("/game/".length) || "index.html";
    let content = assets.get(name);
    if (!content) {
      res.writeHead(404).end();
      return;
    }
    if (name === "sw.js" && generation === 2)
      content = Buffer.from(
        content
          .toString()
          .replace(
            /network-detective-[a-f0-9]{16}/,
            "network-detective-e2e-v2",
          ),
      );
    if (name === "index.html")
      content = Buffer.from(
        content
          .toString()
          .replace(
            '<html lang="ja">',
            `<html lang="ja" data-generation="${generation}">`,
          ),
      );
    res.writeHead(200, {
      "Content-Type": mime[extname(name)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(content);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Test server did not bind");
  let closed = false;
  return {
    url: `http://127.0.0.1:${address.port}/game/`,
    update: () => {
      generation = 2;
    },
    isListening: () => server.listening,
    close: async () => {
      if (closed) return;
      closed = true;
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}
