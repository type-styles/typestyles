# Next.js Example with typestyles

This example demonstrates how to use typestyles with Next.js App Router and React Server Components.

## Features

- **App Router**: Uses Next.js App Router (Next.js 14)
- **React Server Components**: Demonstrates RSC with typestyles
- **Design Tokens**: Shows how to create and use design tokens
- **Theming**: Includes light/dark theme support
- **Component Library**: Example button and card components

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Run the development server:

```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
next-app/
├── app/
│   ├── globals.css       # Global CSS
│   ├── layout.tsx        # Root layout with typestyles
│   └── page.tsx         # Main page
├── components/
│   └── ThemeToggle.tsx  # Theme toggle component
├── styles/
│   ├── button.ts        # Button styles
│   ├── card.ts          # Card styles
│   ├── tokens.ts        # Design tokens
│   └── index.ts        # Style exports
├── package.json
├── tsconfig.json
└── next.config.js
```

## Key Concepts

### Layout Integration

The `TypestylesStylesheet` component is added to the root layout to collect and render CSS:

```tsx
// app/layout.tsx
import { TypestylesStylesheet } from '@typestyles/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <TypestylesStylesheet />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Design Tokens

Create tokens using the `tokens.create()` API:

```ts
// styles/tokens.ts
import { tokens } from 'typestyles';

export const colors = tokens.create('color', {
  primary: '#0066ff',
  secondary: '#64748b',
});
```

### Using Styles

Define styles with `styles.create()` and use them with the className:

```ts
// styles/button.ts
import { styles } from 'typestyles';
import { colors } from './tokens';

export const button = styles.create('button', {
  base: {
    padding: '12px 24px',
    backgroundColor: colors.primary,
  },
});

// In your component
<button className={button('base')}>Click me</button>
```

This renders clean, human-readable class names:

```html
<button class="button-base">Click me</button>
```

## Learn More

- [typestyles documentation](https://typestyles.co)
- [@typestyles/next package](./packages/next/README.md)
