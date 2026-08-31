import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    // Mirror the "@/*" path alias from tsconfig.json.
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  test: {
    // Node by default — the lib modules under test are server-side. Component
    // tests opt into a DOM with a `// @vitest-environment jsdom` file comment.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        // Type-only and generated declarations carry no runtime code.
        "src/lib/types.ts",
        "src/types/**",
        "src/**/*.test.{ts,tsx}",
        // Test helpers, not code under test.
        "src/test/**",
      ],
    },
  },
});
