---
title: Color
description: Type-safe helpers for CSS color functions
---

# Color

The `color` API provides type-safe helpers for modern CSS color functions. These functions return plain CSS strings (no runtime color math), so they compose naturally with token references and other CSS values.

## Basic color functions

### rgb

Create `rgb()` colors with space-separated syntax:

```ts
import { color } from 'typestyles';

color.rgb(0, 102, 255); // "rgb(0 102 255)"
color.rgb(0, 102, 255, 0.5); // "rgb(0 102 255 / 0.5)"
```

### hsl

Create `hsl()` colors:

```ts
color.hsl(220, '100%', '50%'); // "hsl(220 100% 50%)"
color.hsl(220, '100%', '50%', 0.8); // "hsl(220 100% 50% / 0.8)"
```

### oklch

Create `oklch()` colors for perceptually uniform color spaces:

```ts
color.oklch(0.7, 0.15, 250); // "oklch(0.7 0.15 250)"
color.oklch(0.7, 0.15, 250, 0.5); // "oklch(0.7 0.15 250 / 0.5)"
```

### oklab

Create `oklab()` colors:

```ts
color.oklab(0.7, -0.1, -0.1); // "oklab(0.7 -0.1 -0.1)"
color.oklab(0.7, -0.1, -0.1, 0.5); // "oklab(0.7 -0.1 -0.1 / 0.5)"
```

### lab

Create `lab()` colors:

```ts
color.lab('50%', 40, -20); // "lab(50% 40 -20)"
```

### lch

Create `lch()` colors:

```ts
color.lch('50%', 80, 250); // "lch(50% 80 250)"
```

### hwb

Create `hwb()` colors:

```ts
color.hwb(220, '10%', '0%'); // "hwb(220 10% 0%)"
```

## Advanced color functions

### mix

Mix two colors using `color-mix()`:

```ts
// Mix red and blue equally (50/50)
color.mix('red', 'blue');
// "color-mix(in srgb, red, blue)"

// Mix 30% red with 70% blue
color.mix('red', 'blue', 30);
// "color-mix(in srgb, red 30%, blue)"

// Mix in a different color space
color.mix('red', 'blue', 50, 'oklch');
// "color-mix(in oklch, red 50%, blue)"
```

Works great with token references:

```ts
const theme = tokens.create('theme', {
  primary: '#0066ff',
});

// Create a lighter variant of your primary color
color.mix(theme.primary, 'white', 20);
// "color-mix(in srgb, var(--theme-primary) 20%, white)"
```

### alpha

Adjust the opacity of any color:

```ts
color.alpha('red', 0.5); // "color-mix(in srgb, red 50%, transparent)"
color.alpha(theme.primary, 0.2); // "color-mix(in srgb, var(--theme-primary) 20%, transparent)"
color.alpha('#0066ff', 0.8, 'oklch'); // "color-mix(in oklch, #0066ff 80%, transparent)"
```

This is a convenience wrapper around `color.mix()` that mixes any color with transparent.

### lightDark

Use the `light-dark()` CSS function for automatic light/dark mode switching:

```ts
color.lightDark('#111', '#eee');
// "light-dark(#111, #eee)"

// Works with tokens too
color.lightDark(theme.textLight, theme.textDark);
// "light-dark(var(--theme-textLight), var(--theme-textDark))"
```

Note: This requires the browser to support `light-dark()` and the element to have an appropriate `color-scheme` value.

## Using with tokens

All color functions accept token references since tokens are just CSS `var()` strings:

```ts
import { styles, tokens, color as colorFn } from 'typestyles';

const themeColor = tokens.create('color', {
  primary: '#0066ff',
  secondary: '#6b7280',
});

const card = styles.create('card', {
  base: {
    backgroundColor: colorFn.mix(themeColor.primary, 'white', 10),
    borderColor: colorFn.alpha(themeColor.secondary, 0.3),
  },
});
```

## Color spaces for mixing

When using `mix()` or `alpha()`, you can specify different color spaces:

- `'srgb'` (default) - Standard RGB, most common
- `'srgb-linear'` - Linear RGB
- `'display-p3'` - Wide gamut RGB
- `'a98-rgb'` - Wide gamut RGB
- `'prophoto-rgb'` - Very wide gamut
- `'rec2020'` - Ultra HD color space
- `'lab'` - CIE Lab color space
- `'oklab'` - Better Lab, perceptually uniform
- `'xyz'`, `'xyz-d50'`, `'xyz-d65'` - CIE XYZ
- `'hsl'` - HSL color space
- `'hwb'` - HWB color space
- `'lch'` - CIE LCH
- `'oklch'` - Better LCH, perceptually uniform

```ts
// Mix in perceptually uniform space for smoother gradients
color.mix('red', 'blue', 50, 'oklch');
color.alpha(theme.primary, 0.5, 'oklab');
```

## Why no runtime color math?

Unlike some libraries that parse and manipulate colors in JavaScript, these helpers simply generate CSS strings. This means:

- Zero runtime overhead
- Colors are computed by the browser (which can use hardware acceleration)
- Works naturally with CSS custom properties and tokens
- Respects user's color scheme and accessibility preferences
- Smaller bundle size

If you need programmatic color manipulation (e.g., generating a palette programmatically), do that at build time and use the resulting values with these helpers.
