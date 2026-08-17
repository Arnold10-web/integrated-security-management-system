import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
    coverage: {
      provider: "v8",
      thresholds: { lines: 50, branches: 40 },
    },
  },
});
