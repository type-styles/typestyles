---
'typestyles': minor
---

Move `color` helpers to the `typestyles/color` subpath entry to shrink the main runtime bundle (~14.9 KB gzip). CI enforces a gzip budget on `dist/index.js`.

**Breaking:** `import { color } from 'typestyles'` is removed — use `import { color } from 'typestyles/color'` (or named imports from that subpath).
