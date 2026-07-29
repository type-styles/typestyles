---
'typestyles': patch
---

Default `tokens.declare()` typed schema leaves to `inherits: true` for `@property` registration, including direct `atProperty` preset leaves, while preserving explicit `inherits: false` overrides.
