import { defineConfig, configDefaults } from "vitest/config"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { TEST_ENV } from "./test-env"

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Keep Jest-style globals (describe/it/expect/vi) so tests need no per-file imports.
    globals: true,
    // Default DOM env; node-only suites opt out via an `@vitest-environment node` docblock.
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // `config/index.ts` validates env at import time; supply dummy-but-valid values
    // so suites that transitively import it (e.g. via `lib/utils`) can load.
    env: TEST_ENV,
    // Playwright specs live in e2e/ and run via `pnpm test:e2e`, not Vitest.
    exclude: [...configDefaults.exclude, "e2e/**", ".worktrees/**"],
    // We assert on logic, not styles; skip CSS processing for speed and to avoid PostCSS/Tailwind.
    css: false,
  },
})
