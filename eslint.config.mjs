import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "node_modules/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/charting_library/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-require-imports":"off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/set-state-in-effect":"off",
      "react-hooks/exhaustive-deps":"warn",
      "react-hooks/refs":"warn",
      "react-hooks/rules-of-hooks":"warn",
    },
  },
]);

export default eslintConfig;