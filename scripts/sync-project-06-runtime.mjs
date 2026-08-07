import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const cloudflareRoot = resolve(import.meta.dirname, "..");
const caseRoot = resolve(cloudflareRoot, "..");
const runtimeRoot = resolve(caseRoot, "portfolio-replacement");
const sourceRoot = resolve(cloudflareRoot, "src");
const assetRoot = resolve(sourceRoot, "assets");

async function copy(relativeSource, relativeTarget = relativeSource) {
  const source = resolve(runtimeRoot, relativeSource);
  const target = resolve(assetRoot, relativeTarget);
  await mkdir(resolve(target, ".."), { recursive: true });
  await copyFile(source, target);
}

await copyFile(resolve(runtimeRoot, "index.html"), resolve(sourceRoot, "index.html"));

for (const extension of ["png", "webp"]) {
  const family = extension === "png" ? "images" : "images_webp";
  for (const filename of [
    `project-06.${extension}`,
    `project-06-overlay-01.${extension}`,
    `project-06-overlay-02.${extension}`,
    `project-06-overlay-03.${extension}`,
  ]) {
    await copy(`${family}/09/${filename}`);
  }
  await copy(`${family}/previews/09.${extension}`);
  await copy(`${family}/previews/text/09.${extension}`);
}

await copy("project-06-metallic-depth.png");
await copy("project-06-metallic-three-adapter.js");
console.log("Synced project-06 visual and Metallic Paint runtime into Cloudflare source.");
