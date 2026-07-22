---
'typestyles': minor
---

Register `@property` with a syntax-appropriate placeholder `initial-value` (e.g. `transparent` for `<color>`, `0` for `<number>`) instead of always skipping registration for `var()`/`env()`-dependent token values. The real value still reaches the cascade via the existing unconditional `:root` declaration. Add `TokenDescriptor.initial` / `RegisteredPropertyOptions.initial` to override the placeholder explicitly. Note: a dependent token that previously fell back to CSS's default `inherits: true` (because `@property` was skipped) now respects its `inherits` option like any other typed token — pass `inherits: true` explicitly if you relied on the old implicit-inheritance fallback.
