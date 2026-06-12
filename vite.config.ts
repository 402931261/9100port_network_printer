import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig(({ command }) => ({
  plugins: [vue()],
  // 开发模式用默认 base（/），HMR 正常工作；生产模式用 ./，适配 file:// 协议
  base: command === "build" ? "./" : "/",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/renderer"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist/renderer",
    emptyOutDir: true,
  },
}));
