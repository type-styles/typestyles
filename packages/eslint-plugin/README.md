# @typestyles/eslint-plugin

ESLint plugin for [typestyles](https://typestyles.dev) — catches common authoring mistakes at lint time.

## Installation

```bash
npm install --save-dev @typestyles/eslint-plugin
```

## Rules

| Rule | Description | Default |
|---|---|---|
| `no-duplicate-namespace` | Error on duplicate namespace strings in the same file | error |
| `no-unsafe-namespace` | Warn on namespace strings with CSS-unsafe characters | warn |
| `no-unregistered-token-use` | Warn when `tokens.use()` has no matching `tokens.create()` in the file | off |

## Usage

### Flat config (`eslint.config.js`)

```js
import typestyles from '@typestyles/eslint-plugin';

export default [
  typestyles.configs.recommended,
  // …your other configs
];
```

### Legacy config (`.eslintrc`)

```json
{
  "plugins": ["@typestyles"],
  "extends": ["plugin:@typestyles/recommended"]
}
```

### Manual rule configuration

```js
import typestyles from '@typestyles/eslint-plugin';

export default [
  {
    plugins: { '@typestyles': typestyles },
    rules: {
      '@typestyles/no-duplicate-namespace': 'error',
      '@typestyles/no-unsafe-namespace': 'warn',
      '@typestyles/no-unregistered-token-use': 'warn',
    },
  },
];
```

## Rule details

### `no-duplicate-namespace`

Detects when two or more `styles.create()`, `styles.class()`, or `styles.component()` calls in the same file use the same namespace string. Duplicate namespaces cause class-name collisions because both calls generate identical CSS class names.

```ts
// ❌ Both produce ".button-base" — the second one silently overrides
const a = styles.create('button', { base: { color: 'red' } });
const b = styles.create('button', { base: { color: 'blue' } }); // ← error

// ✅
const a = styles.create('button-primary', { base: { color: 'red' } });
const b = styles.create('button-ghost',   { base: { color: 'blue' } });
```

### `no-unsafe-namespace`

Warns when a namespace contains characters outside `[a-zA-Z][a-zA-Z0-9_-]*`. Such names are sanitized at runtime but the sanitized class names differ from the authored names, breaking the "readable class names" guarantee.

```ts
// ❌ Space and ! are sanitized away
styles.create('my button!', { … });

// ✅
styles.create('my-button', { … });
```

### `no-unregistered-token-use`

Warns when `tokens.use('namespace')` is called in a file that has no matching `tokens.create('namespace', …)` or `tokens.createContract('namespace', …)`. This is a file-scope check only; cross-file token references are always valid when the module that calls `create()` is imported first.

```ts
// ❌ No tokens.create('color') in this file
const c = tokens.use('color'); // ← warn

// ✅ Import the token ref instead
import { color } from './tokens';
```
