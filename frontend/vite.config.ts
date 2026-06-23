import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendPort = process.env.BACKEND_PORT ?? "8000";
const backendTarget = `http://127.0.0.1:${backendPort}`;
const backendWsTarget = `ws://127.0.0.1:${backendPort}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": backendTarget,
      "/ws": {
        target: backendWsTarget,
        ws: true,
      },
    },
  },
});
