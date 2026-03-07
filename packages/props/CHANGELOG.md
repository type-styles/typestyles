# @typestyles/props

## 0.3.0

### Minor Changes

- c72cb12: Fix lint errors and TypeScript issues
  - Replace `any` types with `unknown` in type definitions
  - Fix empty object types `{}` in defineProperties
  - Add proper generic type parameters to functions
  - Prefix unused parameters with underscore
  - Add eslint ignores for generated docs files and scripts
  - Fix test assertions to use proper types

### Patch Changes

- Updated dependencies [5b08816]
- Updated dependencies [60bc3e5]
- Updated dependencies [c72cb12]
  - typestyles@0.3.0

## 0.2.0

### Minor Changes

- 1c6b0b7: Add new `@typestyles/props` package for type-safe atomic CSS utility generation, with `defineProperties()` and `createProps()` APIs supporting responsive conditions, shorthand properties, and automatic CSS injection.

  Add `compose` to `styles` namespace for composing multiple selector functions or class strings. Add `createVar()` and `assignVars()` for CSS custom property management. Export `insertRules`, `reset`, and `flushSync` utilities from the sheet module. Add `CSSVarRef` and `RecipeVariants` type exports.

### Patch Changes

- Updated dependencies [1c6b0b7]
  - typestyles@0.2.0

## 0.1.0

### Initial Release

Type-safe atomic CSS utility generator for typestyles.

**Features:**

- `defineProperties()` - Define CSS properties with allowed values and responsive conditions
- `createProps()` - Generate atomic utility classes with full TypeScript inference
- Responsive/conditional styling via media queries, container queries, and custom selectors
- Shorthand property support (e.g., `padding` expanding to `paddingTop`, `paddingRight`, etc.)
- Automatic CSS injection with SSR support via `getRegisteredCss()`
- Full type safety with autocomplete for properties, values, and conditions

**Example:**

```typescript
import { defineProperties, createProps } from '@typestyles/props';

const responsiveProps = defineProperties({
  conditions: {
    mobile: { '@media': '(min-width: 768px)' },
    desktop: { '@media': '(min-width: 1024px)' },
  },
  properties: {
    display: ['flex', 'block', 'grid', 'none'],
    padding: { 0: '0', 1: '4px', 2: '8px', 3: '16px' },
  },
  shorthands: {
    p: ['padding'],
  },
});

const props = createProps('atoms', responsiveProps);

// Type-safe usage with full autocomplete
props({
  display: 'flex',
  padding: 2,
  p: { mobile: 3, desktop: 4 },
});
```
