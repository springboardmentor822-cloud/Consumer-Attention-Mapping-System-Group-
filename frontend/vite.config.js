import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // The main bundle was 537 kB (over Rollup's 500 kB warning limit)
        // because React, the router, data-fetching and charting all landed in
        // one chunk. Splitting the big, rarely-changing vendor libraries out
        // means they cache independently of app code, so a change to a
        // dashboard page no longer forces users to re-download React and
        // Recharts.
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["recharts"],
          "vendor-data": ["@tanstack/react-query", "axios"],
        },
      },
    },
  },
});