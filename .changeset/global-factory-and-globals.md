---
'typestyles': minor
---

Add **`createGlobal`** for scoped global CSS (optional cascade **`layers`** and default **`globalLayer`**), wire **`global`** into **`createTypeStyles`**, and ship a **`typestyles/globals`** entry with Josh Comeau’s **`reset`** (plus **`layer`** support for layered stacks) and small selector recipes.

- **`createTypeStyles`** now returns **`{ styles, tokens, global }`**. With **`layers`**, pass optional **`globalLayer`** so `global.style` / **`global.apply`** defaults match your stack; **`tokenLayer`** remains required when layers are enabled.
- **`global.style`** accepts **`GlobalStyleTuple`** recipes (from **`typestyles/globals`**) in addition to selector + properties; root **`global`** ignores per-call **`layer`** (dev warning) — use **`createGlobal`** / layered **`createTypeStyles`** for `@layer`.
- **`global.apply(...tuples)`** applies multiple tuples in one call.
- New **`content`** helper for typed CSS **`content`** values on the main export.
- Types: **`GlobalApiUnlayered`**, **`GlobalApiLayered`**, **`GlobalStyleTuple`**.
