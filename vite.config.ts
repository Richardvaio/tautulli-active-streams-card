import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "tautulli-active-streams-card.js",
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
});
