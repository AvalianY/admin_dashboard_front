import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";

const origins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);
const hosts = new Set([...origins].map((value) => new URL(value).host));
function guard(req: IncomingMessage, res: ServerResponse, next: () => void) {
  if (
    !hosts.has(req.headers.host ?? "") ||
    (req.headers.origin && !origins.has(req.headers.origin))
  ) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: {
          code: "ORIGIN_NOT_ALLOWED",
          message: "Only the local application may use this development proxy.",
        },
      }),
    );
    return;
  }
  next();
}
const localApi: Plugin = {
  name: "local-api-boundary",
  configureServer(server) {
    server.middlewares.use("/api", guard);
  },
  configurePreviewServer(server) {
    server.middlewares.use("/api", guard);
  },
};

export default defineConfig({
  plugins: [react(), localApi],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "https://e-pharmacy-api-kz62.onrender.com",
        changeOrigin: true,
        secure: true,
        ws: false,
        configure(proxy) {
          proxy.on("proxyReq", (upstream) => upstream.removeHeader("origin"));
        },
      },
    },
  },
  preview: { host: "127.0.0.1", port: 4173, strictPort: true },
});
