import { readFile } from "node:fs/promises";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === "true" ? "/school-h3-map/" : "/",
  plugins: [{
    name: "maplibre-worker-shared-module",
    async generateBundle() {
      const sharedWorker = await readFile(
        new URL("./node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs", import.meta.url)
      );
      this.emitFile({
        type: "asset",
        fileName: "assets/maplibre-gl-shared.mjs",
        source: sharedWorker
      });
    }
  }]
});