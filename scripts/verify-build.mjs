import { createHash } from "node:crypto";
import { access, readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(projectRoot, "src");
const assetRoot = join(sourceRoot, "assets");
const outputRoot = join(projectRoot, "dist");

async function listFiles(root) {
  const files = [];

  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
      } else if (entry.isFile()) {
        files.push(absolutePath);
      }
    }
  }

  await walk(root);
  return files.sort();
}

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

const expectedFiles = new Map();
expectedFiles.set("index.html", join(sourceRoot, "index.html"));

for (const filePath of await listFiles(assetRoot)) {
  expectedFiles.set(relative(assetRoot, filePath), filePath);
}

const builtFiles = await listFiles(outputRoot);
const builtRelativePaths = new Set(builtFiles.map((filePath) => relative(outputRoot, filePath)));
const failures = [];

for (const [relativePath, sourcePath] of expectedFiles) {
  const outputPath = join(outputRoot, relativePath);
  try {
    const [sourceStat, outputStat] = await Promise.all([stat(sourcePath), stat(outputPath)]);
    if (sourceStat.size !== outputStat.size || (await sha256(sourcePath)) !== (await sha256(outputPath))) {
      failures.push(`content mismatch: ${relativePath}`);
    }
  } catch {
    failures.push(`missing build output: ${relativePath}`);
  }
}

for (const relativePath of builtRelativePaths) {
  if (!expectedFiles.has(relativePath)) {
    failures.push(`unexpected build output: ${relativePath}`);
  }
}

try {
  await access(join(outputRoot, "404.html"));
  failures.push("dist/404.html disables Cloudflare Pages automatic SPA fallback");
} catch {
  // Cloudflare Pages treats a project without a top-level 404.html as an SPA.
}

if (failures.length > 0) {
  console.error("Build verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Verified ${expectedFiles.size} files. dist is byte-identical to the validated runtime and Cloudflare SPA fallback remains enabled.`);
