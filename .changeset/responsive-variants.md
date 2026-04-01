---
"typestyles": minor
---

Add `configureBreakpoints()` for responsive variant support in `styles.component()`.

When breakpoints are configured, `styles.component()` automatically generates `@media (min-width: ...)` wrapped classes for each breakpoint+variant combination. The component selector function then accepts responsive variant objects.

```ts
configureBreakpoints({ sm: '640px', md: '768px', lg: '1024px' });

const button = styles.component('button', {
  base: { padding: '8px 16px' },
  variants: {
    size: {
      sm: { fontSize: '12px' },
      lg: { fontSize: '18px' },
    },
  },
});

// Apply 'sm' by default, switch to 'lg' at the 'md' breakpoint:
button({ size: { initial: 'sm', md: 'lg' } });
// → "button-base button-size-sm md-button-size-lg"
```
