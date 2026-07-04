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

## Generating type, motion, and radius scales

The `typestyles/token-scale` subpath does for numeric ladders what `color-scale` does for
color: it turns 2-3 numbers into a whole scale, so a theme author writes `{ base, ratio }`
instead of hand-picking every step. Like `color-scale`, it is vocabulary-agnostic — the
generators return plain numbers and never see names like `fontSize`, `radius`, or `fast`;
zipping your own step names onto the output is your design system's concern.

Reach for each generator by shape:

- **`generateGeometricScale`** — multiplicative ladders where each step is a ratio of the
  last (font sizes, spacing that grows faster at the top). `steps` are signed integer
  offsets from the base: `value(offset) = base * ratio ** offset`.
- **`generateLinearScale`** — even, grid-based ladders (radius steps on a 4px grid).
  `steps` are ordinal multipliers: `value(step) = base * step * multiplier`.
- **`expandDurationBand`** — one motion anchor expanded into a `{ min, base, max }` band:
  `min = base * ratio`, `max = base / ratio`, rounded to the nearest 5ms by default so
  computed bands look hand-picked instead of visibly computed (no `93.75ms`).

```ts
import {
  generateGeometricScale,
  generateLinearScale,
  expandDurationBand,
} from 'typestyles/token-scale';

// Font-size ladder: major third anchored at 16 (offset 0 is always exactly base).
generateGeometricScale({ base: 16, ratio: 1.25, steps: [-2, -1, 0, 1, 2, 3, 4] });
// → [10, 13, 16, 20, 25, 31, 39]

// Radius ladder on a 4px grid.
generateLinearScale({ base: 4, multiplier: 1, steps: [1, 2, 3, 4, 6] });
// → [4, 8, 12, 16, 24]

// One duration anchor → a min/base/max band (call once per named anchor).
expandDurationBand({ base: 150, ratio: 0.625 });
// → { min: 95, base: 150, max: 240 }
```

Outputs are unitless — append `px`/`rem`/`ms` yourself when zipping the numbers into your
own `tokens.create()` calls. All three generators round to whole numbers by default; the
array generators accept a `round` override and `expandDurationBand` accepts a `roundTo`
granularity for callers that want different precision.

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

## Condition scopes: `self`, `ancestor`, `descendant`

`tokens.when.attr(name, value, { scope })` and `tokens.when.className(name, { scope })` accept three `scope` values describing where the marker lives relative to the theme root:

- **`'self'`** — the marker is on the theme root itself: `.theme-app[data-mode="dark"]`.
- **`'ancestor'`** — the marker is on an ancestor of the theme root (e.g. `data-color-mode` on `html`): `[data-mode="dark"] .theme-app`.
- **`'descendant'`** — the marker is on a descendant of the theme root, somewhere inside the themed subtree: `.theme-app [data-mode="dark"]`.

### Fixed-tone surfaces with `scope: 'descendant'`

Sometimes a specific element should render with a **fixed** tone regardless of the page's ambient mode — a toast that is always dark even on a light page, a syntax-highlighted code block that stays dark in light mode. That is not "dark mode": it is a design decision fixed to one element. A descendant-scoped mode expresses exactly that — the marker attribute goes on the element itself, inside the themed subtree:

```ts
import { tokens } from 'typestyles';

const light = { color: { text: '#111827', surface: '#ffffff' } };
const dark = { color: { text: '#e5e7eb', surface: '#0f172a' } };

export const app = tokens.createTheme('app', {
  base: light,
  modes: [
    // Ambient light/dark switching, as usual:
    ...tokens.colorMode.systemWithLightDarkOverride({
      attribute: 'data-color-mode',
      values: { light: 'light', dark: 'dark' },
      scope: 'ancestor',
      light,
      dark,
    }),
    // Fixed-tone override for marked elements inside the themed subtree:
    {
      id: 'surface-dark',
      overrides: dark,
      when: tokens.when.attr('data-surface', 'dark', { scope: 'descendant' }),
    },
  ],
});
```

```html
<div class="theme-app">
  <p>Follows the ambient light/dark mode…</p>
  <div data-surface="dark">…but this toast is always dark.</div>
</div>
```

The descendant-scoped rule compiles to `.theme-app [data-surface="dark"]`, so any element carrying `data-surface="dark"` inside the theme gets the dark token values — no matter what `prefers-color-scheme` or `data-color-mode` currently say. Note that `colorMode.*` presets return plain mode arrays, so you can spread one into `modes` alongside hand-written entries (as above) instead of using the `colorMode` config field.

Two properties worth knowing:

- **No built-in "reset to ambient".** Once a descendant-scoped mode matches, it applies to that whole subtree; a nested child cannot fall back to the ambient mode automatically. Define an explicit mode (e.g. `data-surface="light"`) if you need a counter-tone.
- **`when.not()` is not supported on descendant-scoped conditions** — a descendant relationship cannot collapse into a single `:not()` compound selector. In development this logs a warning and emits no rule.

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

## Component overrides (two-tier model)

When a theme needs to change how a component looks beyond token overrides, there are
two tiers — pick the lightest option that fits.

### Tier 1 — component-scoped CSS custom properties (preferred)

If a component author exposed a property as a CSS custom property (`ctx.vars` /
`c.vars`), consumers override it per theme with ordinary token or theme CSS. Custom
properties inherit down the DOM and reset at each `.theme-*` boundary, so nested
themes stay proximity-correct with no extra tooling.

See [Components — expose themeable properties as vars](/docs/components#expose-themeable-properties-as-vars).

### Tier 2 — plain CSS against semantic class names

For properties the author did not expose as vars, target the stable semantic class
names from `styles.component()` (for example `button-base`, `button-intent-primary`).
See [Class naming](/docs/class-naming) and the [public contract](#public-semantic-class-names).

**Non-nested themes:** a descendant selector in a later cascade layer is enough:

```ts
import { createStyles } from 'typestyles';

const styles = createStyles({
  layers: ['components', 'overrides'] as const,
});

const button = styles.component(
  'button',
  { base: { padding: '8px 16px' } },
  { layer: 'components' },
);

// In theme setup for `.theme-acme`:
styles.class('.theme-acme .button-base', { borderRadius: '999px' }, { layer: 'overrides' });
```

**Nested conflicting themes:** when two `.theme-*` regions nest and both override the
same component class, plain selectors tie on specificity and source order wins. Use
`styles.scope()` so the nearest scoping root wins:

```ts
styles.scope({ root: '.theme-beta', to: '.theme-acme', layer: 'overrides' }, 'button-base', {
  backgroundColor: 'rebeccapurple',
  '&:hover': { opacity: 0.9 },
});
```

`styles.scope()` reuses the same `serializeStyle` / `applyLayerToRules` / `insertRules`
pipeline as other TypeStyles APIs — pseudo-selectors and `@media` in `overrides` work
unchanged.

**Browser support:** `@scope` ships in Chrome 118+, Firefox 128+, Safari 17.4+. Treat
it as an opt-in escalation for nested conflicts; older browsers can keep Tier 2 plain
selectors and accept the documented load-order caveat.

## Public semantic class names

In **`semantic` naming mode** (the default), every class emitted by
`styles.component()` / `styles.class()` is a **public, semver-guarded surface**.
Consumers may target those names in plain CSS, `styles.scope()`, or any other CSS
tooling. Renaming a namespace or variant key is a **breaking change** — TypeScript will
not catch a renamed string literal, so publishable design systems should opt into the
[`@typestyles/no-removed-public-classname`](/docs/publishing-packages#guard-public-class-names)
rule and regenerate `.typestyles-public-classnames.json` deliberately when names change.

## Best practices

1. **Use semantic token names** - `primary`, `surface`, `text` instead of `blue`, `white`, `black`
2. **Define dark mode alongside light mode** - Keep them in sync
3. **Test both themes** - Use visual regression for both modes
4. **Respect system preferences** - Default to `prefers-color-scheme`
5. **Provide user override** - Let users choose independently of system
6. **Store preference** - Use localStorage to remember user choice
7. **Avoid theme flash** - Set theme class before first paint
8. **Use CSS custom properties** - They cascade naturally for nested themes
