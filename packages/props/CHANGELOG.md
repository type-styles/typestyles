# @typestyles/props

## 0.4.1

### Patch Changes

- Updated dependencies [[`aa88d25`](https://github.com/type-styles/typestyles/commit/aa88d251c352c617841f2aefed730c2b2871e50d)]:
  - typestyles@0.6.0

## 0.4.0

### Minor Changes

- [#49](https://github.com/type-styles/typestyles/pull/49): Add ESLint configuration across all packages, examples, and docs. Create shared `eslint.base.js` config with TypeScript rules and add lint scripts to all package.json files. Update CI workflow to run lint via turbo.

### Patch Changes

- [#45](https://github.com/type-styles/typestyles/pull/45): Add comprehensive test coverage for previously untested modules: props utils/generate/runtime, typestyles build, and migrate transform/css/files.
- [#50](https://github.com/type-styles/typestyles/pull/50): Add lint-staged for prettier formatting on pre-commit hook and format entire codebase
- Updated dependencies [[#52](https://github.com/type-styles/typestyles/pull/52)]
- Updated dependencies [[#63](https://github.com/type-styles/typestyles/pull/63)]
- Updated dependencies [[#62](https://github.com/type-styles/typestyles/pull/62)]
- Updated dependencies [[#61](https://github.com/type-styles/typestyles/pull/61)]
- Updated dependencies [[#73](https://github.com/type-styles/typestyles/pull/73)]
- Updated dependencies [[#72](https://github.com/type-styles/typestyles/pull/72)]
- Updated dependencies [[#45](https://github.com/type-styles/typestyles/pull/45)]
- Updated dependencies [[#59](https://github.com/type-styles/typestyles/pull/59)]
- Updated dependencies [[#49](https://github.com/type-styles/typestyles/pull/49)]
- Updated dependencies [[#56](https://github.com/type-styles/typestyles/pull/56)]
- Updated dependencies [[#34](https://github.com/type-styles/typestyles/pull/34)]
- Updated dependencies [[#50](https://github.com/type-styles/typestyles/pull/50)]
- Updated dependencies [[#66](https://github.com/type-styles/typestyles/pull/66)]
- Updated dependencies [[#68](https://github.com/type-styles/typestyles/pull/68)]
- Updated dependencies [[#57](https://github.com/type-styles/typestyles/pull/57)]
- Updated dependencies [[#54](https://github.com/type-styles/typestyles/pull/54)]
- Updated dependencies [[#64](https://github.com/type-styles/typestyles/pull/64)]
  - typestyles@0.5.0

## 0.3.1

### Patch Changes

- Updated dependencies [[#25](https://github.com/type-styles/typestyles/pull/25)]
- Updated dependencies [[#27](https://github.com/type-styles/typestyles/pull/27)]
- Updated dependencies [[#33](https://github.com/type-styles/typestyles/pull/33)]
- Updated dependencies [[#31](https://github.com/type-styles/typestyles/pull/31)]
- Updated dependencies [[#23](https://github.com/type-styles/typestyles/pull/23)]
- Updated dependencies [[#26](https://github.com/type-styles/typestyles/pull/26)]
  - typestyles@0.4.0

## 0.3.0

### Minor Changes

- [#10](https://github.com/type-styles/typestyles/pull/10): Fix lint errors and TypeScript issues
  - Replace `any` types with `unknown` in type definitions
  - Fix empty object types `{}` in defineProperties
  - Add proper generic type parameters to functions
  - Prefix unused parameters with underscore
  - Add eslint ignores for generated docs files and scripts
  - Fix test assertions to use proper types

### Patch Changes

- Updated dependencies [[#9](https://github.com/type-styles/typestyles/pull/9)]
- Updated dependencies [[#13](https://github.com/type-styles/typestyles/pull/13)]
- Updated dependencies [[#10](https://github.com/type-styles/typestyles/pull/10)]
  - typestyles@0.3.0

## 0.2.0

### Minor Changes

- [#6](https://github.com/type-styles/typestyles/pull/6): Add new `@typestyles/props` package for type-safe atomic CSS utility generation, with `defineProperties()` and `createProps()` APIs supporting responsive conditions, shorthand properties, and automatic CSS injection.

  Add `compose` to `styles` namespace for composing multiple selector functions or class strings. Add `createVar()` and `assignVars()` for CSS custom property management. Export `insertRules`, `reset`, and `flushSync` utilities from the sheet module. Add `CSSVarRef` and `RecipeVariants` type exports.

### Patch Changes

- Updated dependencies [[#6](https://github.com/type-styles/typestyles/pull/6)]
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
