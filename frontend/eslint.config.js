import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

/**
 * Flat config (ESLint 9+). The project already had `eslint`,
 * `eslint-plugin-react` and `eslint-plugin-react-hooks` installed plus an
 * `npm run lint` script, but no config file - so the script always failed.
 */
export default [
  {
    // .ts/.tsx are intentionally NOT linted here. They need
    // `typescript-eslint`, which currently supports TypeScript
    // ">=4.8.4 <6.1.0", while this project is on TypeScript 7 - installing it
    // would mean either forcing a broken peer resolution or downgrading a
    // TypeScript setup that compiles clean today. Type and correctness
    // coverage for those files comes from `npm run type-check`
    // (`tsc --noEmit`), which passes with zero errors. Re-add
    // typescript-eslint here once it supports TS 7.
    ignores: ["dist/**", "node_modules/**", "coverage/**", "**/*.ts", "**/*.tsx"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // This project uses the automatic JSX runtime (Vite + React 18), so
      // `React` does not need to be in scope for JSX.
      "react/react-in-jsx-scope": "off",
      // Types are enforced by `tsc --noEmit`, which already runs clean -
      // duplicating that as lint errors on .jsx files adds noise, not safety.
      "react/prop-types": "off",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    // TypeScript files: the base `no-unused-vars` rule misreports type-only
    // syntax, and tsc already covers this ground.
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
];
