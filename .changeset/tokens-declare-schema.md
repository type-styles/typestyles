---
'typestyles': minor
---

`tokens.declare(namespace, schema)` accepts a schema object, emits `@property` for `syntax` leaves, and infers ref types from the input shape. `tokens.create()` accepts plain values only (no inline `TokenDescriptor`); pass `{ decl }` for typed partial fills with merge semantics across calls. Schema-less `declare()`, `declare<T>()`, and `LooseTokenRef` are removed.
