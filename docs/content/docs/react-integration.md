---
title: React Integration
description: Using typestyles with React patterns and best practices
---

# React Integration

TypeStyles works seamlessly with React. This guide shows common patterns for integrating typestyles into React applications.

## Basic component setup

### Simple button component

```tsx
// components/Button/Button.tsx
import { styles } from 'typestyles';
import { color, space } from '../../tokens';

const button = styles.component('button', {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    transition: 'background-color 150ms ease',
  },
  variants: {
    intent: {
      primary: {
        backgroundColor: color.primary,
        color: '#fff',
        '&:hover': { backgroundColor: color.primaryHover },
      },
      secondary: {
        backgroundColor: color.secondary,
        color: '#fff',
        '&:hover': { backgroundColor: color.secondaryHover },
      },
    },
    size: {
      small: { padding: `${space.xs} ${space.sm}`, fontSize: '12px' },
      medium: { padding: `${space.sm} ${space.md}`, fontSize: '14px' },
      large: { padding: `${space.md} ${space.lg}`, fontSize: '16px' },
    },
    disabled: {
      on: { opacity: 0.5, cursor: 'not-allowed' },
      off: {},
    },
    loading: {
      on: { cursor: 'wait' },
      off: {},
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'medium',
    disabled: 'off',
    loading: 'off',
  },
});

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  children,
}: ButtonProps) {
  return (
    <button
      className={button({
        intent: variant,
        size,
        disabled: disabled ? 'on' : 'off',
        loading: loading ? 'on' : 'off',
      })}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
```

### Using the button

```tsx
// App.tsx
import { Button } from './components/Button';

function App() {
  return (
    <div>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button size="large">Large</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
    </div>
  );
}
```

## Polymorphic components

### Creating a polymorphic Box component

```tsx
// components/Box/Box.tsx
import { cx, styles } from 'typestyles';
import { space } from '../../tokens';
import type { ElementType, ComponentPropsWithoutRef } from 'react';

const box = styles.component('box', {
  base: {},
  flex: { display: 'flex' },
  block: { display: 'block' },
  inline: { display: 'inline' },
  hidden: { display: 'none' },
  gap1: { gap: space[1] },
  gap2: { gap: space[2] },
  gap3: { gap: space[3] },
  gap4: { gap: space[4] },
  row: { flexDirection: 'row' },
  column: { flexDirection: 'column' },
  wrap: { flexWrap: 'wrap' },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  p1: { padding: space[1] },
  p2: { padding: space[2] },
  p3: { padding: space[3] },
  p4: { padding: space[4] },
  m1: { margin: space[1] },
  m2: { margin: space[2] },
  m3: { margin: space[3] },
  m4: { margin: space[4] },
});

const {
  base,
  flex,
  block,
  inline,
  hidden,
  gap1,
  gap2,
  gap3,
  gap4,
  row,
  column,
  wrap: wrapClass,
  center: centerClass,
  p1,
  p2,
  p3,
  p4,
  m1,
  m2,
  m3,
  m4,
} = box;

type BoxProps<T extends ElementType = 'div'> = {
  as?: T;
  display?: 'flex' | 'block' | 'inline' | 'hidden';
  gap?: 1 | 2 | 3 | 4;
  direction?: 'row' | 'column';
  wrap?: boolean;
  center?: boolean;
  padding?: 1 | 2 | 3 | 4;
  margin?: 1 | 2 | 3 | 4;
} & Omit<ComponentPropsWithoutRef<T>, 'as'>;

export function Box<T extends ElementType = 'div'>({
  as,
  display,
  gap,
  direction,
  wrap,
  center,
  padding,
  margin,
  className,
  ...props
}: BoxProps<T>) {
  const Component = as || 'div';

  return (
    <Component
      className={cx(
        base,
        display === 'flex' && flex,
        display === 'block' && block,
        display === 'inline' && inline,
        display === 'hidden' && hidden,
        gap === 1 && gap1,
        gap === 2 && gap2,
        gap === 3 && gap3,
        gap === 4 && gap4,
        direction === 'row' && row,
        direction === 'column' && column,
        wrap && wrapClass,
        center && centerClass,
        padding === 1 && p1,
        padding === 2 && p2,
        padding === 3 && p3,
        padding === 4 && p4,
        margin === 1 && m1,
        margin === 2 && m2,
        margin === 3 && m3,
        margin === 4 && m4,
        className,
      )}
      {...props}
    />
  );
}
```

### Using Box as different elements

```tsx
// Using as a div (default)
<Box display="flex" gap={2} padding={3}>
  Content
</Box>

// Using as a button
<Box as="button" display="flex" center padding={2}>
  Click me
</Box>

// Using as a link
<Box as="a" href="/about" display="inline" padding={1}>
  About
</Box>

// Using with custom component
<Box as={CustomComponent} display="block" padding={4}>
  Content
</Box>
```

## Compound components

### Card component with multiple parts

```tsx
// components/Card/Card.tsx
import { cx, styles } from 'typestyles';
import { color, space } from '../../tokens';
import { createContext, useContext, type ReactNode } from 'react';

const card = styles.component('card', {
  base: {
    borderRadius: '8px',
    backgroundColor: color.surface,
    border: `1px solid ${color.border}`,
    overflow: 'hidden',
  },
  elevated: {
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  interactive: {
    cursor: 'pointer',
    transition: 'box-shadow 200ms ease',
    '&:hover': {
      boxShadow: '0 8px 12px rgba(0, 0, 0, 0.15)',
    },
  },
});

const { elevated, interactive } = card;

const cardHeader = styles.component('card-header', {
  base: {
    padding: `${space.md} ${space.lg}`,
    borderBottom: `1px solid ${color.border}`,
  },
});

const cardBody = styles.component('card-body', {
  base: {
    padding: space.lg,
  },
});

const cardFooter = styles.component('card-footer', {
  base: {
    padding: `${space.md} ${space.lg}`,
    borderTop: `1px solid ${color.border}`,
    backgroundColor: color.surfaceRaised,
  },
});

// Context for sharing state between compound components
interface CardContextValue {
  isInteractive: boolean;
}

const CardContext = createContext<CardContextValue>({ isInteractive: false });

// Main Card component
interface CardProps {
  elevated?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export function Card({ elevated = false, interactive = false, onClick, children }: CardProps) {
  return (
    <CardContext.Provider value={{ isInteractive: interactive }}>
      <div
        className={cx(card(), elevated && elevated, interactive && interactive)}
        onClick={onClick}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
      >
        {children}
      </div>
    </CardContext.Provider>
  );
}

// Card.Header
Card.Header = function CardHeader({ children }: { children: ReactNode }) {
  return <div className={cardHeader()}>{children}</div>;
};

// Card.Body
Card.Body = function CardBody({ children }: { children: ReactNode }) {
  return <div className={cardBody()}>{children}</div>;
};

// Card.Footer
Card.Footer = function CardFooter({ children }: { children: ReactNode }) {
  return <div className={cardFooter()}>{children}</div>;
};
```

### Using compound components

```tsx
import { Card } from './components/Card';

function Example() {
  return (
    <Card elevated interactive onClick={() => console.log('Clicked!')}>
      <Card.Header>
        <h3>Card Title</h3>
      </Card.Header>
      <Card.Body>
        <p>Card content goes here...</p>
      </Card.Body>
      <Card.Footer>
        <button>Action</button>
      </Card.Footer>
    </Card>
  );
}
```

## Form components

### Input with validation states

```tsx
// components/Input/Input.tsx
import { cx, styles } from 'typestyles';
import { color, space } from '../../tokens';
import { forwardRef } from 'react';

const inputWrapper = styles.component('input-wrapper', {
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.sm,
  },
});

const inputLabel = styles.component('input-label', {
  base: {
    fontSize: '14px',
    fontWeight: 500,
    color: color.text,
  },
});

const inputHelper = styles.component('input-helper', {
  base: {
    fontSize: '12px',
    color: color.textMuted,
  },
  variants: {
    tone: {
      neutral: {},
      error: { color: color.danger },
      success: { color: color.success },
    },
  },
  defaultVariants: { tone: 'neutral' },
});

const input = styles.component('input', {
  base: {
    width: '100%',
    padding: `${space.sm} ${space.md}`,
    borderRadius: '6px',
    border: `1px solid ${color.border}`,
    fontSize: '14px',
    lineHeight: '1.5',
    backgroundColor: color.surface,
    color: color.text,
    transition: 'border-color 150ms ease, box-shadow 150ms ease',

    '&:focus': {
      outline: 'none',
      borderColor: color.primary,
      boxShadow: `0 0 0 3px ${color.alpha(color.primary, 0.1)}`,
    },

    '&::placeholder': {
      color: color.textMuted,
    },

    '&:disabled': {
      backgroundColor: color.surfaceSunken,
      cursor: 'not-allowed',
    },
  },
  variants: {
    validation: {
      none: {},
      error: {
        borderColor: color.danger,
        '&:focus': {
          borderColor: color.danger,
          boxShadow: `0 0 0 3px ${color.alpha(color.danger, 0.1)}`,
        },
      },
      success: {
        borderColor: color.success,
        '&:focus': {
          borderColor: color.success,
          boxShadow: `0 0 0 3px ${color.alpha(color.success, 0.1)}`,
        },
      },
    },
  },
  defaultVariants: { validation: 'none' },
});

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
  label?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, success, label, helperText, className, ...props }, ref) => {
    const validation = error ? 'error' : success ? 'success' : 'none';
    const helperTone = error ? 'error' : success ? 'success' : 'neutral';

    return (
      <div className={inputWrapper()}>
        {label && <label className={inputLabel()}>{label}</label>}
        <input ref={ref} className={cx(input({ validation }), className)} {...props} />
        {helperText && <span className={inputHelper({ tone: helperTone })}>{helperText}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';
```

## Lists and grids

### Responsive grid component

```tsx
// components/Grid/Grid.tsx
import { styles } from 'typestyles';
import { space } from '../../tokens';
import type { ReactNode } from 'react';

const grid = styles.component('grid', {
  base: { display: 'grid' },
  variants: {
    columns: {
      1: { gridTemplateColumns: 'repeat(1, 1fr)' },
      2: { gridTemplateColumns: 'repeat(2, 1fr)' },
      3: { gridTemplateColumns: 'repeat(3, 1fr)' },
      4: { gridTemplateColumns: 'repeat(4, 1fr)' },
      6: { gridTemplateColumns: 'repeat(6, 1fr)' },
      12: { gridTemplateColumns: 'repeat(12, 1fr)' },
    },
    gap: {
      none: { gap: 0 },
      sm: { gap: space.sm },
      md: { gap: space.md },
      lg: { gap: space.lg },
    },
  },
  defaultVariants: { columns: 1, gap: 'md' },
});

interface GridProps {
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Grid({ columns = 1, gap = 'md', children }: GridProps) {
  return <div className={grid({ columns, gap })}>{children}</div>;
}
```

## Context and theming

### Theme provider

```tsx
// components/ThemeProvider/ThemeProvider.tsx
import { createContext, useContext, useState, type ReactNode } from 'react';
import { darkTheme } from '../../tokens';

interface ThemeContextValue {
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('theme-dark');
  });

  const toggle = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('theme-dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      <div className={isDark ? darkTheme : ''}>{children}</div>
    </ThemeContext.Provider>
  );
}
```

### Using the theme

```tsx
// components/ThemeToggle/ThemeToggle.tsx
import { useTheme } from '../ThemeProvider';
import { Button } from '../Button';

export function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <Button variant="secondary" onClick={toggle}>
      {isDark ? '🌞 Light mode' : '🌙 Dark mode'}
    </Button>
  );
}
```

## Performance optimization

### Memoized class names

For components that re-render frequently, you can memoize class name generation:

```tsx
import { useMemo } from 'react';
import { button } from './button.styles';

function OptimizedButton({
  variant,
  size,
  disabled,
}: {
  variant: 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
  disabled: boolean;
}) {
  const className = useMemo(
    () =>
      button({
        intent: variant,
        size,
        disabled: disabled ? 'on' : 'off',
        loading: 'off',
      }),
    [variant, size, disabled],
  );

  return <button className={className}>Click</button>;
}
```

However, this is usually unnecessary since the selector function is already very fast.

### Code splitting

```tsx
// Lazy load heavy components with their styles
const HeavyChart = lazy(() => import('./components/HeavyChart'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyChart />
    </Suspense>
  );
}
```

The styles in `HeavyChart` are only loaded when the component is imported.

## TypeScript best practices

### Export component prop types

```tsx
// components/Button/Button.tsx
export interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  // ...
}

export function Button(props: ButtonProps) {
  // ...
}
```

### Use strict prop types

```tsx
// Good - strict typing
type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  variant?: ButtonVariant;
}

// Avoid - too permissive
interface ButtonProps {
  variant?: string; // Too broad
}
```

## Summary

Key patterns for React + typestyles:

1. **Define styles at module level** - Never in components
2. **Use TypeScript for prop types** - Get autocomplete and error checking
3. **Compose variants** - Build flexible component APIs
4. **Consider polymorphism** - `as` prop for versatile components
5. **Leverage context** - Share state between compound components
6. **Memoize if needed** - But profile first, selector functions are fast
7. **Code split naturally** - Styles follow component boundaries
