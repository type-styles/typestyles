# @typestyles/props

## 0.4.0

### Minor Changes

- d9c8078: Add ESLint configuration across all packages, examples, and docs. Create shared `eslint.base.js` config with TypeScript rules and add lint scripts to all package.json files. Update CI workflow to run lint via turbo.

### Patch Changes

- ca46784: Add comprehensive test coverage for previously untested modules: props utils/generate/runtime, typestyles build, and migrate transform/css/files.
- f65c570: Add lint-staged for prettier formatting on pre-commit hook and format entire codebase
- Updated dependencies [6c696fb]
- Updated dependencies [439960c]
- Updated dependencies [7a7b212]
- Updated dependencies [0db6aab]
- Updated dependencies [c467888]
- Updated dependencies [6d8114a]
- Updated dependencies [ca46784]
- Updated dependencies [82ebd9c]
- Updated dependencies [d9c8078]
- Updated dependencies [3758a98]
- Updated dependencies [015bb99]
- Updated dependencies [f65c570]
- Updated dependencies [e6f1cb2]
- Updated dependencies [6daacd1]
- Updated dependencies [b8f21ad]
- Updated dependencies [eee07e5]
- Updated dependencies [f7b9ed2]
  - typestyles@0.5.0

## 0.3.1

### Patch Changes

- Updated dependencies [0bb563c]
- Updated dependencies [ee22964]
- Updated dependencies [5b71381]
- Updated dependencies [3e26285]
- Updated dependencies [4f29bb7]
- Updated dependencies [8f0e9a3]
  - typestyles@0.4.0

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
