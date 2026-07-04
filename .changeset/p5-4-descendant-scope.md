---
'typestyles': minor
---

Add `'descendant'` as a third `scope` value on `tokens.when.attr` / `tokens.when.className` theme conditions, compiling to a descendant-combinator selector (`.theme-name [data-x="y"]`) so a mode can match a marker element inside the themed subtree — the relationship a fixed-tone surface (e.g. an always-dark toast on a light page) needs. `when.not()` on a descendant-scoped condition is rejected with an explicit dev warning (P5.4).
