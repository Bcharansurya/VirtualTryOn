import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development the React app talks to the local Express proxy (server/index.js).
// In production on Vercel, /api/tryon is served by api/tryon.js instead.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { "/api": "http://localhost:8787" },
  },
});
