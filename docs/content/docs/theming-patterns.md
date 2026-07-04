---
title: Theming Patterns
description: Light/dark mode, multi-brand theming, and advanced theme strategies
---

TypeStyles uses CSS custom properties for theming, making it flexible and powerful. This guide covers common theming patterns.

## Theme surfaces

`tokens.createTheme(name, config)` registers a **theme surface**: a stable class name `theme-{name}` whose custom properties override token values for that subtree.

- **`config.base`** — Token overrides always applied on `.theme-{name}` (your usual light / brand default).
- **`config.modes`** — Manual list of `{ id, overrides, when }` layers (see `tokens.when.*`).
- **`config.colorMode`** — Preset mode layers from `tokens.colorMode.*` (media-only dark, attribute toggles, light/dark/system, etc.).

Provide **`modes` or `colorMode`, not both.** Overrides use the same nested shape as `tokens.create` (nested keys become hyphenated `--namespace-key` variables).

The return value is a **`ThemeSurface`**: `{ className, name }`, with `String(surface)` and template literals resolving to `className`. In React, pass **`surface.className`** (or `String(surface)`) to `className` props.

For **dark only when the OS prefers dark**, use `tokens.createDarkMode(name, overrides)` or `colorMode: tokens.colorMode.mediaOnly({ dark: … })`.

See [Tokens](/docs/tokens) for the core API. The `THEME.md` file at the repository root documents conditions, presets, and cascade ordering in full.

Try a minimal light/dark surface in the live example below — toggle **Dark** to see the theme class, token overrides, and emitted CSS change together.

<!-- doc-live-demo id="theming-light-dark" -->

## Generating a theme from one accent color

The design-system example ships `createColorTheme` — a semantic mapper that turns a single
hex accent into light and dark `DesignColorValues` using the core `typestyles/color-scale`
math (OKLCH ramps + WCAG contrast checks).

```ts
import { createColorTheme } from '@examples/design-system';

const { light, dark } = createColorTheme({
  accent: '#0064E0',
  neutralStyle: 'neutral', // 'neutral' | 'cool' | 'warm'
  contrast: 'standard', // 'standard' | 'high'
});

// Plug into createDesignTheme / tokens.createTheme mode overrides:
export const brandTheme = createDesignTheme({
  name: 'brand',
  light: { color: light, syntax: defaultLightSyntaxValues },
  dark: { color: dark, syntax: defaultDarkSyntaxValues },
});
```

**Layering:** `typestyles/color-scale` is vocabulary-agnostic (`parseColor`, `generateRamp`,
`contrastRatio`). `createColorTheme` lives in `examples/design-system` and decides which ramp
step maps to `background.app`, `accent.default`, and so on. Derived tokens such as
`accent.subtle` and `text.disabled` still come from the existing `color-mix()` machinery in
`tokens/index.ts` — `createColorTheme` only fills the base semantic slots.

**Core API** (usable without the design-system vocabulary):

```ts
import { parseColor, generateRamp, contrastRatio } from 'typestyles/color-scale';

const accent = parseColor('#0064E0'); // { l, c, h } in OKLCH units
const ramp = generateRamp({ hue: accent.h, chroma: accent.c }); // 10-step OKLCH strings
contrastRatio('#000', '#fff'); // 21
```

Dev-mode contrast warnings (`console.warn`) fire when generated pairs fall below 4.5:1
(standard) or 7:1 (high); they never throw.

## Basic light/dark mode

### Creating a theme

```ts
// tokens.ts
import { tokens } from 'typestyles';

// Define your base tokens
export const color = tokens.create('color', {
  // Light mode defaults
  text: '#111827',
  textMuted: '#6b7280',
  surface: '#ffffff',
  surfaceRaised: '#f9fafb',
  surfaceSunken: '#f3f4f6',
  border: '#e5e7eb',
  primary: '#0066ff',
  primaryHover: '#0052cc',
});

// Create dark theme override (class theme-dark)
export const darkTheme = tokens.createTheme('dark', {
  base: {
    color: {
      text: '#e0e0e0',
      textMuted: '#9ca3af',
      surface: '#1a1a2e',
      surfaceRaised: '#25253e',
      surfaceSunken: '#16162a',
      border: '#3f3f5c',
      primary: '#66b3ff',
      primaryHover: '#3399ff',
    },
  },
});
```

### Applying the theme

```tsx
// App.tsx
import { darkTheme } from './tokens';

function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    <div className={isDark ? darkTheme.className : ''}>
      <button onClick={() => setIsDark(!isDark)}>Toggle theme</button>
      <PageContent />
    </div>
  );
}
```

### Persisting theme preference

```tsx
// hooks/useTheme.ts
import { useState, useEffect } from 'react';
import { darkTheme } from '../tokens';

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';

      // Fall back to system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Optional: Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', isDark ? '#1a1a2e' : '#ffffff');
    }
  }, [isDark]);

  return {
    isDark,
    themeClass: isDark ? darkTheme.className : '',
    toggle: () => setIsDark(!isDark),
  };
}
```

## System preference detection

### CSS-only approach (no flash)

```ts
// tokens.ts
export const color = tokens.create('color', {
  text: '#111827',
  surface: '#ffffff',
  // ... other tokens
});

export const darkTheme = tokens.createTheme('dark', {
  base: {
    color: {
      text: '#e0e0e0',
      surface: '#1a1a2e',
    },
  },
});
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <head>
    <script>
      // Prevent flash of wrong theme
      (function () {
        const theme =
          localStorage.getItem('theme') ||
          (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        if (theme === 'dark') {
          document.documentElement.classList.add('theme-dark');
        }
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

```tsx
// App.tsx
import { darkTheme } from './tokens';

function App() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains(darkTheme.className),
  );

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    if (newTheme) {
      document.documentElement.classList.add(darkTheme.className);
    } else {
      document.documentElement.classList.remove(darkTheme.className);
    }
  };

  return <div className={isDark ? darkTheme.className : ''}>{/* app content */}</div>;
}
```

### Dark from media query only

If you do not toggle a class yourself and only want dark tokens when `prefers-color-scheme: dark` matches:

```ts
import { tokens } from 'typestyles';

const light = { color: { text: '#111827', surface: '#ffffff' } };
const dark = { color: { text: '#e5e7eb', surface: '#0f172a' } };

export const appTheme = tokens.createTheme('app', {
  base: light,
  colorMode: tokens.colorMode.mediaOnly({ dark }),
});
```

Apply `appTheme.className` once on your root; dark overrides apply automatically via CSS.

## Multi-brand theming

### Different themes for different contexts

```ts
// themes.ts
import { tokens } from 'typestyles';

// Define base tokens structure
const baseTokens = {
  color: {
    primary: '',
    secondary: '',
    text: '',
    surface: '',
  },
  space: {
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
};

// Brand A theme
export const brandA = tokens.createTheme('brand-a', {
  base: {
    color: {
      primary: '#0066ff',
      secondary: '#6b7280',
      text: '#111827',
      surface: '#ffffff',
    },
  },
});

// Brand B theme
export const brandB = tokens.createTheme('brand-b', {
  base: {
    color: {
      primary: '#10b981',
      secondary: '#f59e0b',
      text: '#1f2937',
      surface: '#fafafa',
    },
  },
});

// Brand C theme
export const brandC = tokens.createTheme('brand-c', {
  base: {
    color: {
      primary: '#ef4444',
      secondary: '#8b5cf6',
      text: '#0f172a',
      surface: '#f8fafc',
    },
  },
});
```

### Applying brand themes

```tsx
// App.tsx
import { brandA, brandB, brandC } from './themes';

const brands = {
  a: brandA,
  b: brandB,
  c: brandC,
};

function App({ brandId }) {
  const surface = brands[brandId] || brandA;

  return (
    <div className={surface.className}>
      <PageContent />
    </div>
  );
}
```

### Nested themes

Themes can be nested for scoped theming:

```tsx
import { brandA, brandB } from './themes';

function App() {
  return (
    <div className={brandA.className}>
      <Header /> {/* Uses brandA colors */}
      <main>
        <div className={brandB.className}>
          <Widget /> {/* Uses brandB colors */}
        </div>
      </main>
      <Footer /> {/* Uses brandA colors */}
    </div>
  );
}
```

CSS custom properties cascade naturally, so the inner theme overrides only affect its subtree.

## Overriding component styles from a theme

Sometimes a theme needs to change how a component looks beyond the tokens it consumes. TypeStyles supports this with a **two-tier model** — and a public contract that makes it safe.

### The public contract: semantic class names are stable API

Once a package ships a `styles.component()` or `styles.class()` call in `semantic` naming mode, its emitted class names (`button-base`, `button-intent-primary`, and every other `{namespace}-{variant-segment}` combination) and their pseudo-selectors are a **stable, semver-guarded public surface**. You are entitled to target them directly — with plain CSS, `styles.scope()`, or any other CSS tooling. Renaming a namespace or a variant key is a breaking change under the package's normal versioning rules.

TypeScript can't defend this promise (renaming the string literal in `styles.component('button', …)` produces no compiler error anywhere), so it's defended deliberately: package authors can enable the opt-in [`@typestyles/no-removed-public-classname`](/docs/publishing-packages#eslint-enforcement) ESLint rule, which diffs the class names a file emits against a committed snapshot and errors on removals/renames until the change is acknowledged with a changeset.

See [Components → Class names are a public contract](/docs/components#class-names-are-a-public-contract) for the component-author side of this promise.

### Tier 1 — component-scoped CSS custom properties (use this first)

If a component author exposed a property as a CSS custom property (see [`c.vars`](/docs/components)), override the var at your theme boundary. This is the primary override surface — custom properties inherit down the DOM tree and get reassigned at each `.theme-*` boundary, so **nested themes are proximity-correct for free**, with no `@scope`, no layers, and no tooling:

```ts
import { global } from 'typestyles';

// The button exposes --button-bg; each theme region reassigns it for its own subtree.
global.style('.theme-acme', { '--button-bg': '#ff6600' });
global.style('.theme-beta', { '--button-bg': '#0066ff' });
```

### Tier 2 — plain CSS against the public class name (the escape hatch)

For a property the author didn't anticipate exposing as a var, write CSS against the stable class name.

**Non-nested theme regions** — this already works today; no new API needed. A themed selector placed in a cascade layer after the component's own layer wins outright (layer order decides, not specificity):

```ts
import { createStyles } from 'typestyles';

const styles = createStyles({ scopeId: 'app', layers: ['components', 'overrides'] as const });

styles.class(
  'acme-button-override',
  {
    /* … */
  },
  { layer: 'overrides' },
);
// or a global themed selector:
// global.style('.theme-acme .button-intent-primary', { borderRadius: '999px' });
```

**Nested, conflicting theme regions** — the one case plain selectors can't solve. `.theme-acme .button-base { … }` and `.theme-beta .button-base { … }` have identical specificity, so within a layer the winner is whichever rule was inserted **later** — a fact about module load order, not DOM structure. `styles.scope()` closes that gap with CSS `@scope`, whose proximity-based matching picks the rule whose scoping root is the _nearest_ ancestor:

```ts
import { styles } from 'typestyles';

// A .theme-beta widget nested inside a .theme-acme page: each override
// wins exactly inside its own nearest theme region, regardless of load order.
styles.scope({ root: '.theme-acme' }, 'button-intent-primary', {
  backgroundColor: 'rebeccapurple',
  '&:hover': { backgroundColor: 'purple' },
});

styles.scope({ root: '.theme-beta' }, 'button-intent-primary', {
  backgroundColor: 'seagreen',
});
```

`styles.scope({ root, to?, layer? }, className, overrides)`:

- `overrides` goes through the same serializer as `styles.class` / `styles.component`, so pseudo-selectors and nested at-rules (`'&:hover'`, `'@media …'`) work unchanged.
- `to` sets a lower boundary: `@scope (.theme-acme) to (.island)` stops matching at `.island`.
- `layer` (on a `createStyles({ layers })` instance) wraps the `@scope` rule in `@layer` so scoped overrides participate in your existing layer stack. It stays optional — an unlayered override intentionally beats all layered styles.
- Rules register through the normal sheet: deduped, SSR-collected, and captured by zero-runtime build extraction automatically.

> **Browser support:** `@scope` ships in Chrome 118+, Firefox 128+, and Safari 17.4+. It's an opt-in escalation for the nested-conflict case only — if you target older browsers, stay on the non-nested Tier 2 pattern (plain selector + layer) and accept that nested conflicting themes resolve by registration order.

**Decision guide:** exposed as a var → override the var (Tier 1). Not a var, themes don't nest → plain selector + layer. Not a var, nested conflicting themes → `styles.scope()`.

## Component-specific themes

### Isolated component theming

```ts
// components/Chart/Chart.tokens.ts
import { tokens } from 'typestyles';

// Chart-specific tokens that don't affect the rest of the app
export const chartTheme = tokens.createTheme('chart', {
  base: {
    color: {
      primary: '#0066ff',
      secondary: '#10b981',
      tertiary: '#f59e0b',
      quaternary: '#ef4444',
      grid: '#e5e7eb',
      axis: '#6b7280',
    },
  },
});
```

```tsx
// components/Chart/Chart.tsx
import { chartTheme } from './Chart.tokens';

export function Chart({ data }) {
  return (
    <div className={chartTheme.className}>
      <svg className={chart('svg')}>{/* Chart uses chart-specific color tokens */}</svg>
    </div>
  );
}
```

## Seasonal/time-based themes

### Time-aware theming

```ts
// themes/seasonal.ts
import { tokens } from 'typestyles';

export const holidayTheme = tokens.createTheme('holiday', {
  base: {
    color: {
      primary: '#c41e3a', // Holiday red
      secondary: '#165b33', // Holiday green
      accent: '#ffd700', // Gold
    },
  },
});

export const springTheme = tokens.createTheme('spring', {
  base: {
    color: {
      primary: '#88c999',
      secondary: '#f4a460',
      accent: '#ffb6c1',
    },
  },
});
```

```tsx
// hooks/useSeasonalTheme.ts
import { holidayTheme, springTheme } from '../themes/seasonal';

export function useSeasonalTheme(): string | undefined {
  const now = new Date();
  const month = now.getMonth();

  // Holiday season: December
  if (month === 11) {
    return holidayTheme.className;
  }

  // Spring: March-May
  if (month >= 2 && month <= 4) {
    return springTheme.className;
  }

  return undefined; // Use default theme
}
```

## Advanced theme composition

### Partial themes

```ts
// themes/semantics.ts
import { tokens } from 'typestyles';

// Semantic color tokens
export const successTheme = tokens.createTheme('success', {
  base: {
    color: {
      primary: '#10b981',
      primaryHover: '#059669',
    },
  },
});

export const warningTheme = tokens.createTheme('warning', {
  base: {
    color: {
      primary: '#f59e0b',
      primaryHover: '#d97706',
    },
  },
});

export const dangerTheme = tokens.createTheme('danger', {
  base: {
    color: {
      primary: '#ef4444',
      primaryHover: '#dc2626',
    },
  },
});
```

```tsx
// components/Alert/Alert.tsx
import { successTheme, warningTheme, dangerTheme } from '../../themes/semantics';

const alertThemeClasses = {
  success: successTheme.className,
  warning: warningTheme.className,
  danger: dangerTheme.className,
};

export function Alert({ type, children }) {
  return <div className={alertThemeClasses[type]}>{children}</div>;
}
```

### Token layering

```ts
// tokens/layers.ts
import { tokens } from 'typestyles';

// Layer 1: Primitives
const primitives = tokens.create('primitives', {
  // Raw values
  blue500: '#0066ff',
  blue600: '#0052cc',
  gray500: '#6b7280',
});

// Layer 2: Semantic tokens
const color = tokens.create('color', {
  // Reference primitives
  primary: primitives.blue500,
  primaryHover: primitives.blue600,
  text: '#111827',
});

// Layer 3: Component tokens
const button = tokens.create('button', {
  // Reference semantic tokens
  backgroundColor: color.primary,
  backgroundColorHover: color.primaryHover,
  textColor: '#ffffff',
});
```

## Light / dark / system on `data-*`

When the user can pick light, dark, or system, and **light must win over system dark**, use `tokens.colorMode.systemWithLightDarkOverride`:

```ts
import { tokens } from 'typestyles';

const light = { color: { text: '#111827', surface: '#ffffff' } };
const dark = { color: { text: '#e5e7eb', surface: '#0f172a' } };

export const shell = tokens.createTheme('shell', {
  base: light,
  colorMode: tokens.colorMode.systemWithLightDarkOverride({
    attribute: 'data-color-mode',
    values: { light: 'light', dark: 'dark', system: 'system' },
    scope: 'ancestor',
    light,
    dark,
  }),
});
```

Set `data-color-mode` on `html` (or another ancestor); apply `shell.className` on your themed subtree.

## Accessibility considerations

### High contrast mode

```ts
// themes/accessibility.ts
import { tokens } from 'typestyles';

export const highContrastTheme = tokens.createTheme('high-contrast', {
  base: {
    color: {
      text: '#000000',
      surface: '#ffffff',
      primary: '#0000ff',
      border: '#000000',
    },
  },
});
```

```tsx
// hooks/useAccessibility.ts
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(mediaQuery.matches);

    const handler = (e) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isHighContrast;
}
```

### Respect user preferences

```ts
// tokens.ts
import { tokens } from 'typestyles';

export const color = tokens.create('color', {
  text: '#111827',
  // ... other tokens
});

export const darkTheme = tokens.createTheme('dark', {
  base: {
    color: {
      text: '#e0e0e0',
      // ... other overrides
    },
  },
});

// Optional: separate surface for motion tokens, etc.
export const reducedMotionTheme = tokens.createTheme('reduced-motion', {
  base: {
    /* motion-related overrides */
  },
});
```

```tsx
// App.tsx
import { darkTheme } from './tokens';

function App() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const themeClasses = [prefersDark && darkTheme.className, prefersReducedMotion && 'reduce-motion']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={themeClasses}>
      <PageContent />
    </div>
  );
}
```

## Theme switching transitions

### Smooth theme transitions

```css
/* Add to your global CSS or a style element */
html,
body,
* {
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}
```

Or with typestyles global CSS:

```ts
import { global } from 'typestyles';

global.style('html', {
  transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
});
```

Use a scoped `global` from `createTypeStyles({ layers, globalLayer })` when you emit globals into a cascade layer (see [Cascade layers](/docs/cascade-layers)).

### Prevent flash during theme switch

```tsx
import { useEffect, useState } from 'react';
import { darkTheme } from './tokens';

function ThemeProvider({ children }) {
  const [themeClass, setThemeClass] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Read theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    setThemeClass(savedTheme === 'dark' ? darkTheme.className : '');
    setIsReady(true);
  }, []);

  // Prevent rendering until theme is determined
  if (!isReady) {
    return null; // or a loading spinner
  }

  return <div className={themeClass}>{children}</div>;
}
```

## SSR with themes

### Server-side theme detection

```ts
// server.ts
import { collectStyles } from 'typestyles/server';
import { darkTheme } from './tokens';

app.get('/', (req, res) => {
  // Detect theme from cookie or user preference
  const themeCookie = req.cookies.theme;
  const isDark = themeCookie === 'dark';
  const htmlClass = isDark ? darkTheme.className : '';

  const { html, css } = collectStyles(() =>
    renderToString(
      <div className={htmlClass}>
        <App />
      </div>
    )
  );

  res.send(`
    <!DOCTYPE html>
    <html class="${htmlClass}">
      <head>
        <style id="typestyles">${css}</style>
      </head>
      <body>
        <div id="root">${html}</div>
      </body>
    </html>
  `);
});
```

## Best practices

1. **Use semantic token names** - `primary`, `surface`, `text` instead of `blue`, `white`, `black`
2. **Define dark mode alongside light mode** - Keep them in sync
3. **Test both themes** - Use visual regression for both modes
4. **Respect system preferences** - Default to `prefers-color-scheme`
5. **Provide user override** - Let users choose independently of system
6. **Store preference** - Use localStorage to remember user choice
7. **Avoid theme flash** - Set theme class before first paint
8. **Use CSS custom properties** - They cascade naturally for nested themes
