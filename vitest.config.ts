import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    // Per-file environment: add @vitest-environment jsdom to component test files
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
