# @typestyles/next

Next.js integration for typestyles with full support for App Router, Pages Router, and React Server Components.

## Installation

```bash
npm install @typestyles/next typestyles
# or
pnpm add @typestyles/next typestyles
# or
yarn add @typestyles/next typestyles
```

## Requirements

- Next.js >= 13.0.0
- React >= 18.0.0
- typestyles >= 0.1.0

## Quick Start

### App Router (Recommended)

Import `getRegisteredCss` in your root layout to inject styles during SSR:

```tsx
// app/layout.tsx
import { getRegisteredCss } from '@typestyles/next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const css = getRegisteredCss();

  return (
    <html lang="en">
      <head>{css && <style dangerouslySetInnerHTML={{ __html: css }} />}</head>
      <body>{children}</body>
    </html>
  );
}
```

### Pages Router

Wrap your pages with the stylesheet component:

```tsx
// pages/_app.tsx
import { TypestylesStylesheet } from '@typestyles/next';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <TypestylesStylesheet>
      <Component {...pageProps} />
    </TypestylesStylesheet>
  );
}
```

## React Server Components (RSC)

The package provides multiple approaches for RSC support:

### Option 1: Layout SSR (Simplest)

Import `getRegisteredCss` in your root layout - this works in both Server and Client Components:

```tsx
// app/layout.tsx
import { getRegisteredCss } from '@typestyles/next';

export default function RootLayout({ children }) {
  const css = getRegisteredCss();

  return (
    <html>
      <head>{css && <style dangerouslySetInnerHTML={{ __html: css }} />}</head>
      <body>{children}</body>
    </html>
  );
}
```

### Option 2: Client Component Provider

For complex cases with dynamic styles, create a client component wrapper:

```tsx
// components/TypestylesProvider.tsx
'use client';

import { getRegisteredCss } from 'typestyles/server';
import { useEffect, useState } from 'react';

export function TypestylesProvider({ children }) {
  const [css, setCss] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCss(getRegisteredCss());
  }, []);

  return (
    <>
      {children}
      {mounted && css && <style id="typestyles" dangerouslySetInnerHTML={{ __html: css }} />}
    </>
  );
}
```

Then use it in your layout:

```tsx
// app/layout.tsx
import { TypestylesProvider } from '@/components/TypestylesProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TypestylesProvider>{children}</TypestylesProvider>
      </body>
    </html>
  );
}
```

### Option 3: Metadata API

For static generation, you can collect styles in `generateMetadata`:

```tsx
// app/layout.tsx
import { generateMetadata } from 'next';
import { getTypestylesMetadata } from '@typestyles/next/server';
import { Home } from './Home';

export async function generateMetadata() {
  const css = await getTypestylesMetadata(<Home />);
  return {
    styles: [{ cssText: css, id: 'typestyles' }],
  };
}
```

## API Reference

### getRegisteredCss

Returns all currently registered CSS as a string. This is the simplest way to get styles for SSR.

```tsx
import { getRegisteredCss } from '@typestyles/next';

const css = getRegisteredCss();
```

### collectStylesFromComponent

Collect styles from a React component tree. Useful when you need explicit control over style collection.

```tsx
import { collectStylesFromComponent } from '@typestyles/next/server';
import { YourComponent } from './YourComponent';

const css = await collectStylesFromComponent(<YourComponent />);
```

### getTypestylesMetadata

Generate CSS for use in Next.js metadata API. Collects styles by rendering the component server-side.

```tsx
import { getTypestylesMetadata } from '@typestyles/next/server';
import { Home } from './Home';

const css = await getTypestylesMetadata(<Home />);
```

### TypestylesStylesheet (Pages Router)

A React component that renders typestyles CSS. Works with Pages Router.

```tsx
import { TypestylesStylesheet } from '@typestyles/next';

<TypestylesStylesheet>
  <YourApp />
</TypestylesStylesheet>;
```

## Examples

### Basic Usage with App Router

```tsx
// app/page.tsx
import { styles } from 'typestyles';

const button = styles.create('button', {
  base: {
    padding: '12px 24px',
    backgroundColor: '#0066ff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
});

export default function Home() {
  return (
    <main>
      <button className={button('base')}>Click me</button>
    </main>
  );
}
```

### With Design Tokens

```tsx
// app/tokens.ts
import { tokens } from 'typestyles';

export const colors = tokens.create('color', {
  primary: '#0066ff',
  secondary: '#64748b',
});

export const spacing = tokens.create('space', {
  sm: '8px',
  md: '16px',
  lg: '24px',
});

// app/page.tsx
import { styles } from 'typestyles';
import { colors, spacing } from './tokens';

const card = styles.create('card', {
  base: {
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: '8px',
  },
});

export default function Page() {
  return <div className={card('base')}>Hello World</div>;
}
```

### With Dark Mode

```tsx
// app/layout.tsx
import { tokens } from 'typestyles';
import { getRegisteredCss } from '@typestyles/next';

const darkTheme = tokens.createTheme('dark', {
  color: {
    background: '#1a1a1a',
    text: '#ffffff',
  },
});

export default function RootLayout({ children }) {
  const css = getRegisteredCss();

  return (
    <html className={darkTheme}>
      <head>{css && <style dangerouslySetInnerHTML={{ __html: css }} />}</head>
      <body>{children}</body>
    </html>
  );
}
```

## Troubleshooting

### Flash of Unstyled Content (FOUC)

If you see a flash of unstyled content, ensure `getRegisteredCss()` is called in the layout and styles are injected before the body renders.

### Styles not appearing

Make sure `typestyles` is installed in your project:

```bash
npm install typestyles
```

### TypeScript errors

Ensure you have `"moduleResolution": "bundler"` or `"node"` in your `tsconfig.json`.

## License

MIT
