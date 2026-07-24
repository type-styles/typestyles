---
'typestyles': minor
---

Add namespace-optional overloads for `tokens.declare(schema)` and `tokens.create(values)` so design systems can register a flat token tree without a namespace segment in emitted `--*` names.

When the namespace is omitted, custom property names use `--{scopeId}-{path}` (scoped) or `--{path}` (unscoped) instead of `--{scopeId}-{namespace}-{path}`. Pass `{ decl }` on `create()` to pair with a namespace-less `declare()` for schema validation and forward references.
