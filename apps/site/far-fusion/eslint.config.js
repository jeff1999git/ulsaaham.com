// ESLint flat config for the site: `bun run lint`.
//
// Correctness rules fail the run. Tidiness rules (unused names, empty blocks,
// needless escapes) and the React Compiler's advisory checks only warn, so a
// lint run never blocks on style.
import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

// ESLint 9 does not count <Card /> as a use of Card, so no-unused-vars would
// report every component import. This marks the names a JSX tag refers to as
// used, as eslint-plugin-react's jsx-uses-vars does.
const jsxUsesVars = {
  meta: { type: "problem", schema: [] },
  create(context) {
    return {
      JSXOpeningElement(node) {
        let name = node.name;
        if (name.type === "JSXNamespacedName") return;
        while (name.type === "JSXMemberExpression") name = name.object;
        // <div> is an element; <Card> and <icons.star> refer to variables.
        if (node.name.type === "JSXIdentifier" && /^[a-z]/.test(name.name)) return;
        context.sourceCode.markVariableAsUsed(name.name, node);
      },
    };
  },
};

// Everything in the hooks preset beyond rules-of-hooks comes from the React
// Compiler and describes code it could not optimise. The site does not use
// the compiler, so those checks are advice, and warn.
const hooksRules = Object.fromEntries(
  Object.entries(reactHooks.configs.flat["recommended-latest"].rules).map(([rule, level]) => [
    rule,
    rule === "react-hooks/rules-of-hooks" ? level : "warn",
  ])
);

export default [
  {
    ignores: [".vercel/**", ".astro/**", "dist/**"],
  },

  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-useless-escape": "warn",
    },
  },

  // Build scripts, tests and tool configs run under node.
  {
    files: ["scripts/**", "tests/**", "*.config.{js,mjs,cjs}"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: { sourceType: "commonjs" },
  },

  // Site code: server routes and the mailer run on node; components and the
  // lib helpers they import render on the server and run in the browser.
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ["src/**/*.jsx"],
    plugins: { "react-hooks": reactHooks, local: { rules: { "jsx-uses-vars": jsxUsesVars } } },
    rules: { ...hooksRules, "local/jsx-uses-vars": "error" },
  },

  // .astro files: the plugin gives the frontmatter node globals and lints each
  // <script> as a browser file, with define:vars names declared.
  ...astro.configs["flat/recommended"],
];
