---
'typestyles': minor
'@typestyles/cli': patch
'@typestyles/eslint-plugin': patch
---

Breaking: semantic component class names now use `block`, `block--dimension-option`,
and `block__slot` forms instead of hyphen semantic names. Compound variants now emit
chained modifier selectors instead of `*-compound-N` classes. Attribute mode now
kebab-cases `data-*` names and supports slots, returning per-slot
`{ className, attrs, props }` results.
