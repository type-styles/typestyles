---
'typestyles': minor
---

Add `tokens.declare(namespace, options?)` — a lazy `var(--…)` reference proxy for referencing a token before its value exists, either within the same `tokens.create()` call (self-referencing derived tokens) or across modules without a real import cycle. Names resolve through the same logic `tokens.create`/`tokens.use` already use, including `scopeId` and `nameTemplate`.
