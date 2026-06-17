---
'typestyles': patch
---

`styles.compose()` now infers merged variant selection types from composed component functions (P3.22). Unknown variant keys are rejected by TypeScript and logged in development when no composed function accepts them.
