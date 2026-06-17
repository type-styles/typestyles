# @typestyles/migrate

CLI codemods for migrating from **styled-components** and **Emotion** to [typestyles](https://github.com/type-styles/typestyles).

Moving off runtime CSS-in-JS is often the hardest part of adopting typestyles. This package automates the boring, safe transforms so you can focus on prop-based dynamics (`createVar` / `assignVars`) and design tokens — the parts that need human judgment.

Full migration guide: [typestyles.dev/docs/migration](https://typestyles.dev/docs/migration)

## What it transforms

| Source                              | Becomes                                             |
| ----------------------------------- | --------------------------------------------------- |
| `styled.div\`...\``                 | `styles.class('div', { ... })` + `className` on JSX |
| `styled(Button)\`...\``             | `styles.class('button', { ... })` + `className`     |
| `` css`...` `` (Emotion)            | `styles.class(...)`                                 |
| Static template literals            | CSS object properties (via PostCSS parser)          |
| `` `${props => props.x}` ``         | `createVar` + `assignVars` + `styles.class`         |
| `` `${props => props.x ? A : B}` `` | `styles.component` variants + JSX rewrite           |
| `` `${({ x }) => x}` ``             | `createVar` + `assignVars` (destructured params)    |
| `@media` in templates               | Nested `'@media (…)'` objects in style definitions  |

The codemod rewrites JSX usage for styled components it can safely transform and adds the required `import { styles } from 'typestyles'`.

## What it skips (with warnings)

Honest automation beats silent breakage:

- **Unsupported interpolations** — theme access (`props.theme…`), non-literal ternaries, and other non-prop expressions
- **Exported styled components** — avoids changing your public API shape without review
- **Non-JSX references** to styled component variables

Prop-based patterns like `` `${props => props.color}` `` and `` `${(props) => props.width}px` `` are converted to [`createVar` + `assignVars`](https://typestyles.dev/docs/dynamic-styles). Boolean prop ternaries like `` `${props => props.primary ? '#0066ff' : '#6b7280'}` `` become `styles.component` variants. Suffix text after the interpolation (e.g. `px`) is applied at the call site.

## Installation

```bash
npm install -D @typestyles/migrate typestyles
```

The CLI binary is `typestyles-migrate`.

## Usage

**Dry run (default)** — prints unified diffs, does not write files:

```bash
npx typestyles-migrate src
```

**Apply changes:**

```bash
npx typestyles-migrate src --write
```

**Scoped run:**

```bash
npx typestyles-migrate src/components \
  --include "**/*.tsx" \
  --exclude "**/*.test.tsx" \
  --extensions .ts,.tsx
```

**JSON report** (for CI or review):

```bash
npx typestyles-migrate src --report migration-report.json --write
```

### CLI options

```
typestyles-migrate <paths...> [options]

  --write                Apply changes in-place (default is dry-run)
  --include <glob>       Include glob (repeatable)
  --exclude <glob>       Exclude glob (repeatable)
  --extensions <list>    Comma-separated extensions (default: .ts,.tsx)
  --report <path>        Write JSON report
  --help                 Show help
```

## Example

**Before:**

```tsx
import styled from 'styled-components';

const Button = styled.button`
  padding: 8px 16px;
  background: #0066ff;
  color: white;
  border-radius: 6px;

  &:hover {
    background: #0052cc;
  }
`;

export function App() {
  return <Button>Click me</Button>;
}
```

**After:**

```tsx
import { styles } from 'typestyles';

const button = styles.class('button', {
  padding: '8px 16px',
  background: '#0066ff',
  color: 'white',
  borderRadius: '6px',
  '&:hover': {
    background: '#0052cc',
  },
});

export function App() {
  return <button className={button}>Click me</button>;
}
```

For components with variants, follow up manually with `styles.component()` — see the [styled-components migration section](https://typestyles.dev/docs/migration#from-styled-components).

## Programmatic API

Use the same transform in custom tooling:

```ts
import { migrateSource, runMigration } from '@typestyles/migrate';

const result = migrateSource('Button.tsx', sourceCode);
// result.code, result.changed, result.warnings

await runMigration(process.cwd(), {
  targets: ['src'],
  write: false,
  extensions: ['.tsx'],
  include: [],
  exclude: ['**/*.test.tsx'],
});
```

## Recommended workflow

1. **Dry-run** on a branch and review diffs
2. **Fix warnings** — convert dynamic templates to vars or inline styles
3. **Apply with `--write`**
4. **Refactor** repeated `styles.class` calls into `styles.component` with variants
5. **Add tokens** — replace hard-coded colors/spacing with `tokens.create`
6. **Enable extraction** — add `@typestyles/vite` or your bundler plugin for production zero-runtime

## Related packages

| Package                                         | Role                                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------- |
| [`typestyles`](../typestyles)                   | Target styling library                                                |
| [`@typestyles/eslint-plugin`](../eslint-plugin) | Catch shorthand/longhand conflicts and invalid values after migration |
| [`@typestyles/props`](../props)                 | Optional Tailwind-style utilities if you used Panda/Chakra patterns   |

## License

Apache-2.0
