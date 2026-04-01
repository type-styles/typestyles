---
"@typestyles/eslint-plugin": minor
---

Initial release of `@typestyles/eslint-plugin`.

Includes three rules:

- **`no-duplicate-namespace`** (error): detects when two `styles.create()`, `styles.class()`, or `styles.component()` calls in the same file use the same namespace string, which would cause class-name collisions.
- **`no-unsafe-namespace`** (warn): warns when a namespace contains characters outside `[a-zA-Z][a-zA-Z0-9_-]*` that would be sanitized away at runtime.
- **`no-unregistered-token-use`** (off by default): warns when `tokens.use()` has no matching `tokens.create()` in the same file.

Supports both ESLint flat config and legacy `.eslintrc`.
