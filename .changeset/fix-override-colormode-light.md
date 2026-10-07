---
'typestyles': patch
---

Fix `Theme.override({ tokens })` when the parent root also stored `colorMode.light` — token patches are folded into the light snapshot so they win at compile instead of being discarded by the inherited light tree.
