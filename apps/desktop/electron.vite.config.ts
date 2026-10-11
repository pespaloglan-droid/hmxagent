// Based on opencode-dev/packages/desktop (MIT) — electron-vite main+preload deseni.
// Renderer ayri degil: React UI (apps/web build'i) dashboard sunucusu uzerinden sunulur.
import { defineConfig } from "electron-vite";

export default defineConfig({
  main: {
    build: {
      outDir: "out/main",
      rollupOptions: {
        input: { index: "src/main/index.ts" },
      },
    },
  },
  preload: {
    build: {
      outDir: "out/preload",
      rollupOptions: {
        input: { index: "src/preload/index.ts" },
      },
    },
  },
});
