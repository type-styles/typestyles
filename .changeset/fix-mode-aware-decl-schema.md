---
'typestyles': patch
---

Fix `tokens.create(..., { decl })` rejecting mode-aware `{ light, dark }` leaves. Schema validation now expands those leaves before path checks so declared color slots accept light/dark pairs.
