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

Upgrade notes: regenerate public-classname snapshots; update hand-written CSS /
tests that targeted `*-base` or `*-compound-N`. Prefer distinct namespaces for
`styles.class` and `styles.component` when they would share a base class string —
dev builds warn on that collision. See docs migration guide (0.10 semantic naming).
