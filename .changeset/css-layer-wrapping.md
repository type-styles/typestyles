---
"typestyles": minor
---

Add `configureLayer(name?)` for CSS `@layer` cascade wrapping.

When enabled, every generated CSS rule is wrapped inside a named cascade layer (`@layer <name> { ... }`). This prevents typestyles rules from overriding user styles that have no layer, since unlayered styles always win over layered ones regardless of specificity — fixing style conflict ordering issues when typestyles coexists with third-party CSS.

A bare `@layer <name>;` declaration is also emitted first to establish the layer in the cascade before any rules are inserted.

```ts
import { configureLayer } from 'typestyles';

// Call once, before any styles are registered:
configureLayer();        // uses "@layer typestyles { ... }"
configureLayer('ui');    // uses "@layer ui { ... }"
```
