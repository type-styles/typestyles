---
"typestyles": minor
---

Add `styles.atomic()` and `serializeAtomicStyle()` for per-property atomic CSS output.

`styles.atomic(properties)` decomposes a style object into one CSS class per declaration. Identical property+value pairs across different components share the same atomic class — CSS file size plateaus as the codebase grows, and specificity conflicts are eliminated at the property level.

```ts
// Both calls share the `.ts-abc1` class for `color: red` — only one CSS rule emitted:
const a = styles.atomic({ color: 'red', fontSize: '14px' });
// → "ts-abc1 ts-def2"

const b = styles.atomic({ color: 'red', padding: '8px' });
// → "ts-abc1 ts-ghi3"  (ts-abc1 reused — no duplicate CSS)
```

`serializeAtomicStyle` is also exported for advanced use cases (e.g. integrating with custom build pipelines).
