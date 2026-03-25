# @examples/design-system

Framework-agnostic design tokens and recipes used by the docs and example apps.

## CodeBlock copy helper pattern

Use the `codeBlock` recipe with `data-*` hooks so any framework (or vanilla JS) can attach clipboard behavior:

```html
<div class="...codeBlock('root')" data-codeblock>
  <div class="...codeBlock('header')" data-codeblock-header>
    <div class="...codeBlock('actions')">
      <button
        type="button"
        class="...codeBlock('copyButton') ...codeBlock('copyButtonIdle')"
        data-codeblock-copy
        data-copy-label="Copy code"
        data-copied-label="Copied"
        aria-label="Copy code"
      >
        Copy
      </button>
      <span
        class="...codeBlock('feedback') ...codeBlock('feedbackInline')"
        data-codeblock-feedback
        role="status"
        aria-live="polite"
      ></span>
    </div>
  </div>
  <pre><code>...</code></pre>
</div>
```

Minimal behavior:

1. On `[data-codeblock-copy]` click, read text from the closest code element and write to `navigator.clipboard`.
2. Toggle `data-copied` or `data-error` on the button for visual state styles.
3. Set button `aria-label` to `Copied` on success, and restore to `Copy code` after a timeout.
4. Announce status text through `[data-codeblock-feedback]` (`role="status"` + `aria-live="polite"`).

## Syntax highlighting (`highlight.js`)

Import the stylesheet side effect once (it registers `ds-hljs` rules):

```ts
import '@examples/design-system/codeHighlight';
```

### Semantic tokens (`ds-code-syntax`)

| Token | Meaning |
| --- | --- |
| `base` | Default foreground |
| `keyword` | Keywords, types, `language_*` |
| `title` | Titles, class names, function names |
| `attr` | Attributes, numbers, operators, variables, selectors |
| `string` | Strings, regexps |
| `builtIn` | Built-ins, symbols |
| `comment` | Comments, doc formulas |
| `name` | XML tags, pseudo-selectors |
| `section` | Headings |
| `bullet` | List bullets |
| `addition` / `additionBg` | Diff additions (foreground / wash) |
| `deletion` / `deletionBg` | Diff deletions (foreground / wash) |

Values default to the docs site oklch ramps (`codeSyntaxLightValues`). Dark mode: override `--ds-code-syntax-*` in your theme class (the docs app merges `codeSyntaxDarkValues` into `theme-docs-dark`).

### highlight.js class mapping

highlight.js emits `span` nodes with classes like `hljs-keyword`. This theme groups them as follows:

- **keyword** — `.hljs-keyword`, `.hljs-type`, `.hljs-template-*`, `.hljs-variable.language_*`, …
- **title** — `.hljs-title` (+ class / function variants)
- **attr** — `.hljs-attr`, `.hljs-number`, `.hljs-operator`, `.hljs-variable`, selector classes, …
- **string** — `.hljs-string`, `.hljs-regexp`, `.hljs-meta .hljs-string`
- **comment** — `.hljs-comment`, `.hljs-code`, `.hljs-formula`
- **addition / deletion** — `.hljs-addition`, `.hljs-deletion`

Use `hljs.highlight(code, { language })` (or `marked-highlight` with `langPrefix: 'hljs language-'`) so the output includes these classes; typography inherits from `.hljs` on the root `code` element.

## Prose / docs content primitives (`proseContent`)

Long-form markdown helpers live in `proseContent` from `@examples/design-system`. Put `proseContent('root')` on the element that wraps rendered HTML.

Covered primitives:

| Primitive | Markdown / HTML | Notes |
| --- | --- | --- |
| **Blockquote** | `> …` | Tinted panel + accent border |
| **`kbd`** | `<kbd>Ctrl</kbd>` | Keyboard cap styling |
| **Badge** | `<span data-docs-badge>New</span>` | Optional `data-docs-badge-tone`: `success`, `warning`, `danger`, `info` |
| **Table** | GFM tables | For wide tables wrap with `<div class="…proseContent('tableWrap')">` |
| **Divider** | `---` → `<hr>` | Themed horizontal rule |
| **Heading links** | `h1`–`h6` | Apps can inject `<a data-prose-heading-anchor>` permalinks (see docs site) |

**Docs site** composes `proseContent('root')` with site overrides and merges `designColorDarkValues` into the dark theme so `--ds-color-*` tracks the shell.

### Admonition-style callouts (markdown-only)

GFM does not have native admonitions. Options:

1. **`Alert` recipe** — Prefer Astro/React components (`alert` + `Alert.astro` / `Alert.tsx`) for `info` | `success` | `warning` | `danger` | `tip` with solid/subtle modes.
2. **Blockquote convention** — Use a leading label line:

   ```md
   > **Note**  
   > Short supporting copy in plain markdown.
   ```

   Style tweaks for `blockquote > p:first-child strong` can be added in your app if you want label colors per keyword.

3. **Raw HTML** — `<div data-alert …>` is not defined; use the `alert()` classes from the design system or the component wrappers above.
