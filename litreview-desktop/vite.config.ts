import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// 从环境变量读取端口，默认使用 1420
// @ts-expect-error process is a nodejs global
const port = parseInt(process.env.VITE_PORT || "1420", 10);

// @ts-expect-error process is a nodejs global
const hmrPort = parseInt(process.env.VITE_HMR_PORT || `${port + 1}`, 10);

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  //    注意：在智能脚本模式下，我们使用 strictPort: true，因为端口已经预先检测过
  //    如果直接使用 vite dev，strictPort: false 会自动寻找下一个可用端口
  server: {
    port,
    strictPort: false, // 允许自动寻找下一个可用端口
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: hmrPort,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
