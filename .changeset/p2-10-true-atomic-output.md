---
'typestyles': minor
---

Rename hash-only class naming mode to `compact` and implement true per-declaration `atomic` output with cross-component dedup (P2.10). `styles.class`, `styles.component`, and `styles.hashClass` in `atomic` mode now emit one class per CSS declaration; identical declarations share a class.
