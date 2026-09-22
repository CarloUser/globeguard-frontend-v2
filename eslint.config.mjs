import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      // Playwright writes these after a run; they are gitignored, and linting a bundled
      // trace viewer produced 2794 warnings that hid everything real.
      "playwright-report/**",
      "test-results/**",
      "blob-report/**",
      "playwright/.cache/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
