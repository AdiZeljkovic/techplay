import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // An apostrophe in prose is not a defect; React escapes it correctly.
      "react/no-unescaped-entities": "off",
      // A real signal, but not one worth failing a deploy over while the API
      // surface is still hand-typed. Visible, not blocking.
      "@typescript-eslint/no-explicit-any": "warn",
      // React Compiler advisories: real signals about re-render cost and
      // effect discipline, but they describe code that works today. Visible as
      // warnings so the count is honest; CI gates on breakage, not on smell.
      "react-hooks/static-components": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      // rules-of-hooks stays an error — that one is a crash, not a smell.
      "react-hooks/rules-of-hooks": "error",

      // Dead code, and worth removing — but one at a time, by reading them.
      // A warning keeps the count visible without gating every deploy on a
      // cleanup that has to be done by hand.
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrors: "none",
      }],
    },
  },
  {
    // Build scripts run in Node, where require() is the right call.
    files: ["scripts/**/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
