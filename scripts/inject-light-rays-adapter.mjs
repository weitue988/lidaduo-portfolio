import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const indexPath = resolve(root, "src/index.html");
const temporaryPath = `${indexPath}.tmp`;
const marker = '<script src="light-rays-three-adapter.js" defer></script>';
const html = await readFile(indexPath, "utf8");

if (html.includes(marker)) {
  console.log("LightRays adapter is already injected.");
  process.exit(0);
}

const closingBodyMatches = html.match(/<\/body>/g) || [];
if (closingBodyMatches.length !== 1) {
  throw new Error(`Expected exactly one closing body tag, found ${closingBodyMatches.length}.`);
}

const nextHtml = html.replace("</body>", `${marker}</body>`);
await writeFile(temporaryPath, nextHtml);
await rename(temporaryPath, indexPath);
console.log("Injected LightRays adapter before the closing body tag.");
