# typestyles-vscode

VS Code extension for [TypeStyles](https://github.com/type-styles/typestyles) — hover CSS previews, token swatches, and go-to-definition for style authoring.

Vanilla Extract and StyleX ship editor tooling; this extension closes the same gap for TypeStyles adopters evaluating the DX in the first 30 minutes.

## Features

### Hover CSS preview

Hover a `styles.component()`, `styles.class()`, or `styles.hashClass()` call to see:

- Emitted class names (semantic mode by default, or inferred `scopeId` / `mode` from `createTypeStyles()`)
- Generated CSS rules for `base` and static `variants`

Dynamic component configs (`styles.component('button', (c) => …)`) show an explanatory note instead of a misleading preview.

### Token value previews

Hover a color value inside `tokens.create()` or a token reference like `color.primary` to see:

- Inline **color swatches** (SVG chips in the hover)
- The resolved value and CSS variable name (`--color-primary`)
- **All known values** when theme overrides exist in the same file — e.g. default `:root` plus dark/light layers from `tokens.createTheme()` / `tokens.colorMode.*`

Try `docs/src/demos/theming-light-dark.ts`: hover `themeColor.primary` to see both the default and `.theme-dark` override.

### Go to definition

- Jump from a component call (`button({ intent: 'primary' })`) to its `styles.component()` definition
- Jump from a semantic class string (`app-button-base`) to the registration that emits it

### CSS property docs (optional)

Hover a style object property key (e.g. `padding`, `display`) for a short description. Disable via `typestyles.showCssPropertyDocs`.

## Installation

### From source (monorepo)

```bash
pnpm install
pnpm --filter typestyles-vscode build
```

Then in VS Code: **Extensions** → **…** → **Install from VSIX…** after `pnpm --filter typestyles-vscode package`, then **Developer: Reload Window**. The VSIX bundles the TypeScript parser (no separate runtime deps).

If hovers still show only TypeScript types, confirm **TypeStyles** appears under installed extensions and reload the window after installing.

### Marketplace

Not yet published — install from source or the release VSIX attached to the PR.

## Settings

| Setting                          | Default    | Description                                                                         |
| -------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| `typestyles.previewMode`         | `semantic` | Fallback class naming mode when the file does not call `createTypeStyles({ mode })` |
| `typestyles.showCssPropertyDocs` | `true`     | Show short docs when hovering CSS property keys in style objects                    |

## Limitations (MVP)

- Analysis is per-file; cross-file go-to-definition for re-exported components is not supported yet
- Theme mode previews require `tokens.createTheme()` (or `colorMode` presets) in the **same file** as the token definition
- Previews require static style object literals (no runtime interpolations)
- `atomic` / `compact` hashed previews use the configured preview mode, not live registry state

## Development

```bash
pnpm --filter typestyles-vscode test
pnpm --filter typestyles-vscode lint
pnpm --filter typestyles-vscode typecheck
```

## License

Apache-2.0
