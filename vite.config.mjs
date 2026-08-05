import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const sourceRoot = resolve(projectRoot, "src");
const outputRoot = resolve(projectRoot, "dist");

export default defineConfig({
  root: sourceRoot,
  publicDir: resolve(sourceRoot, "assets"),
  build: {
    outDir: outputRoot,
    emptyOutDir: true,
    copyPublicDir: true,
    minify: false,
  },
  plugins: [
    {
      name: "preserve-validated-runtime-html",
      closeBundle() {
        mkdirSync(outputRoot, { recursive: true });
        copyFileSync(resolve(sourceRoot, "index.html"), resolve(outputRoot, "index.html"));
      },
    },
  ],
});
