import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
async function files(dir, prefix = "") {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory())
      result.push(...(await files(join(dir, entry.name), `${path}/`)));
    else if (path !== "sw.js") result.push(path);
  }
  return result.sort();
}
const assets = await files("dist");
const hash = createHash("sha256");
let compressed = 0;
for (const path of assets) {
  const data = await readFile(join("dist", path));
  hash.update(path);
  hash.update(data);
  compressed += gzipSync(data).length;
}
const template = await readFile("src/pwa/sw-template.js", "utf8");
const output = template
  .replace("__VERSION__", hash.digest("hex").slice(0, 16))
  .replace("__ASSETS__", JSON.stringify(assets));
await writeFile("dist/sw.js", output);
compressed += gzipSync(output).length;
console.log(
  `PWA: ${assets.length} assets; gzip total ${(compressed / 1024).toFixed(1)} KiB (1MB以内の目標)`,
);
if (compressed > 1_000_000)
  throw new Error("初回必須資産が圧縮後1MBを超えています");
