import type { TokenValues, TokenRef, ThemeOverrides } from './types.js';
import { insertRule } from './sheet.js';

/**
 * Registry tracking which token namespaces have been created,
 * so tokens.use() can provide warnings in development.
 */
const registeredNamespaces = new Set<string>();

/**
 * Create a proxy-based token reference for a namespace.
 * Property access returns var(--{namespace}-{key}).
 */
function createTokenProxy<T extends TokenValues>(namespace: string): TokenRef<T> {
  return new Proxy({} as TokenRef<T>, {
    get(_target, prop: string) {
      return `var(--${namespace}-${prop})`;
    },
  });
}

/**
 * Create design tokens as CSS custom properties.
 *
 * Generates a :root rule with the custom properties and returns
 * a typed object where property access yields var() references.
 *
 * @example
 * ```ts
 * const color = createTokens('color', {
 *   primary: '#0066ff',
 *   secondary: '#6b7280',
 * });
 *
 * color.primary  // "var(--color-primary)"
 * ```
 */
export function createTokens<T extends TokenValues>(namespace: string, values: T): TokenRef<T> {
  registeredNamespaces.add(namespace);

  // Generate CSS custom property declarations
  const declarations = Object.entries(values)
    .map(([key, value]) => `--${namespace}-${key}: ${value}`)
    .join('; ');

  const css = `:root { ${declarations}; }`;
  insertRule(`tokens:${namespace}`, css);

  return createTokenProxy<T>(namespace);
}

/**
 * Reference tokens defined elsewhere without injecting CSS.
 *
 * Returns a typed proxy that produces var() references.
 * Useful for consuming shared tokens from a different module.
 *
 * @example
 * ```ts
 * const color = useTokens('color');
 * color.primary  // "var(--color-primary)"
 * ```
 */
export function useTokens<T extends TokenValues = TokenValues>(namespace: string): TokenRef<T> {
  if (
    process.env.NODE_ENV !== 'production' &&
    registeredNamespaces.size > 0 &&
    !registeredNamespaces.has(namespace)
  ) {
    console.warn(
      `[typestyles] tokens.use('${namespace}') references a namespace that hasn't been created yet. ` +
        `Make sure tokens.create('${namespace}', ...) is called before using these tokens.`,
    );
  }

  return createTokenProxy<T>(namespace);
}

/**
 * Create a theme class that overrides token values.
 *
 * Returns a class name string. Apply it to any element to override
 * token values for that subtree via CSS custom property cascading.
 *
 * @example
 * ```ts
 * const dark = createTheme('dark', {
 *   color: { primary: '#66b3ff', surface: '#1a1a2e' },
 * });
 *
 * <div className={dark}>  // class="theme-dark"
 * ```
 */
export function createTheme(name: string, overrides: ThemeOverrides): string {
  const className = `theme-${name}`;

  const declarations: string[] = [];
  for (const [namespace, values] of Object.entries(overrides)) {
    for (const [key, value] of Object.entries(values)) {
      if (value != null) {
        declarations.push(`--${namespace}-${key}: ${value}`);
      }
    }
  }

  const css = `.${className} { ${declarations.join('; ')}; }`;
  insertRule(`theme:${name}`, css);

  return className;
}
