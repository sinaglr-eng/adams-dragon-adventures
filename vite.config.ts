import { defineConfig } from "vite";
export default defineConfig({
  root: "app",
  base: "/adams-dragon-adventures/",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    assetsDir: "game-assets",
    target: "safari15",
  },
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
});
