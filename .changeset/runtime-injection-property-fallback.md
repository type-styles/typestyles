---
'typestyles': patch
---

Fix two runtime injection bugs that could leave pages completely unstyled in real browsers:

- `@property` registrations whose initial value contains `var()` / `env()` now degrade to the universal `"*"` syntax without an `initial-value` (the CSS spec requires initial values to be computationally independent, so browsers rejected the typed rule outright). `inherits` behavior is preserved, and defaults still cascade via the `:root` / base-style assignments.
- Rules rejected by `CSSStyleSheet.insertRule` are now appended as text to a dedicated `<style id="typestyles-fallback">` element instead of the main managed element. Appending text to the main element made browsers re-parse it from its text content, silently discarding every rule previously inserted through `insertRule` — a single rejected rule wiped the entire runtime sheet.
