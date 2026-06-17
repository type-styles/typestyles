# @typestyles/eslint-plugin

ESLint rules for [typestyles](https://github.com/type-styles/typestyles) style objects — catch authoring mistakes at edit time that would otherwise produce invalid or silently wrong CSS.

StyleX and similar tools reject conflicting declarations at compile time. TypeStyles is runtime-first, so these rules fill the gap: shorthand/longhand conflicts, invalid unitless values, and duplicate namespaces across files.

## Installation

```bash
npm install -D @typestyles/eslint-plugin eslint
```

Peer dependency: ESLint ^8.57 or ^9.

Requires `@typescript-eslint/parser` (or typescript-eslint flat config) for TypeScript/TSX files.

## Quick start (flat config)

```js
// eslint.config.js
import tseslint from 'typescript-eslint';
import { configs as typestylesConfigs } from '@typestyles/eslint-plugin';

export default tseslint.config(...tseslint.configs.recommended, typestylesConfigs.recommended);
```

The `recommended` preset enables all three rules as errors.

## Rules

### `@typestyles/no-shorthand-longhand-conflict`

Disallows mixing CSS shorthand and longhand in the same style object.

```ts
// ❌ paddingTop is ignored unpredictably
styles.class('card', {
  padding: '8px',
  paddingTop: '16px',
});

// ✅ pick one
styles.class('card', { padding: '8px 8px 8px 16px' });
```

Applies to `styles.component`, `styles.class`, variant objects, and nested selectors inside those calls.

### `@typestyles/no-invalid-unitless-value`

Catches bare number **strings** on properties that need units. TypeStyles auto-appends `px` to numeric literals, not strings.

```ts
// ❌ emits invalid `line-height: 24px` is fine, but `"24"` as string does not get px
styles.class('text', { lineHeight: '24' });

// ✅
styles.class('text', { lineHeight: 24 }); // → 24px where applicable
styles.class('text', { lineHeight: '1.5' }); // unitless ratio as string
```

Optional rule option `checkSuspiciousUnitlessNumbers` warns when a numeric literal is used on truly unitless properties (e.g. `lineHeight: 24` vs `lineHeight: 1.5`).

### `@typestyles/no-duplicate-namespace`

Disallows reusing the same logical namespace across the project:

```ts
// file-a.ts
styles.component('button', { base: { … } });

// file-b.ts — ❌ collision
styles.component('button', { base: { … } });
```

Tracks `styles.component`, `styles.class`, `tokens.create`, `tokens.createTheme`, `keyframes.create`, and `global.style` / `global.fontFace` namespaces. Reports duplicates within a file and across files in the same ESLint run.

> Bundler plugins (`@typestyles/vite`, etc.) also fail the build on duplicate `styles.component` / `styles.class` namespaces. ESLint catches the issue earlier in the editor.

## Enable individual rules

```js
import typestylesPlugin from '@typestyles/eslint-plugin';

export default [
  {
    plugins: { '@typestyles': typestylesPlugin },
    rules: {
      '@typestyles/no-shorthand-longhand-conflict': 'error',
      '@typestyles/no-invalid-unitless-value': 'warn',
      '@typestyles/no-duplicate-namespace': 'error',
    },
  },
];
```

## Monorepo reference

This repository uses the plugin via `eslint.base.js`:

```js
import { configs as typestylesEslintConfigs } from '@typestyles/eslint-plugin';

export const typestylesAppConfig = tseslint.config(
  ...baseConfig,
  typestylesEslintConfigs.recommended,
);
```

## Related packages

| Package                             | Role                                  |
| ----------------------------------- | ------------------------------------- |
| [`typestyles`](../typestyles)       | Core library the rules analyze        |
| [`@typestyles/migrate`](../migrate) | Codemods — run ESLint after migrating |
| [`@typestyles/vite`](../vite)       | Build-time duplicate namespace checks |

## License

Apache-2.0
