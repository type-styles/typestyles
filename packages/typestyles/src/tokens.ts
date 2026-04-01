import type { TokenValues, TokenRef, ThemeOverrides, ThemeContractRef } from './types.js';
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
export function createTokens<T extends TokenValues>(
  namespace: string,
  values: T
): TokenRef<T> {
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
export function useTokens<T extends TokenValues = TokenValues>(
  namespace: string
): TokenRef<T> {
  if (
    process.env.NODE_ENV !== 'production' &&
    registeredNamespaces.size > 0 &&
    !registeredNamespaces.has(namespace)
  ) {
    console.warn(
      `[typestyles] tokens.use('${namespace}') references a namespace that hasn't been created yet. ` +
        `Make sure tokens.create('${namespace}', ...) is called before using these tokens.`
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
 * **Overload 1 – untyped (backward-compatible):** accepts a plain
 * `ThemeOverrides` object with partial namespace/key coverage.
 *
 * **Overload 2 – contract-enforced:** accepts a `ThemeContractRef` produced
 * by `tokens.createContract()`. TypeScript will error if any key defined in
 * the contract is missing from `values`. Use this when you want compile-time
 * assurance that a theme is complete.
 *
 * @example Untyped (partial overrides allowed):
 * ```ts
 * const dark = tokens.createTheme('dark', {
 *   color: { primary: '#66b3ff', surface: '#1a1a2e' },
 * });
 * ```
 *
 * @example Contract-enforced (all keys required):
 * ```ts
 * const colorContract = tokens.createContract('color', {
 *   primary: '',
 *   secondary: '',
 *   surface: '',
 * });
 *
 * // TypeScript errors if any key is missing:
 * const dark = tokens.createTheme('dark', colorContract, {
 *   primary: '#66b3ff',
 *   secondary: '#aabbcc',
 *   surface: '#1a1a2e',
 * });
 * ```
 */
export function createTheme(name: string, overrides: ThemeOverrides): string;
export function createTheme<T extends TokenValues>(
  name: string,
  contract: ThemeContractRef<T>,
  values: { [K in keyof T]: string },
): string;
export function createTheme<T extends TokenValues>(
  name: string,
  contractOrOverrides: ThemeContractRef<T> | ThemeOverrides,
  values?: { [K in keyof T]: string },
): string {
  let overrides: ThemeOverrides;

  if (isThemeContractRef(contractOrOverrides)) {
    const namespace = contractOrOverrides.__namespace;
    overrides = { [namespace]: values as Record<string, string> };
  } else {
    overrides = contractOrOverrides as ThemeOverrides;
  }

  const className = `theme-${name}`;

  const declarations: string[] = [];
  for (const [namespace, vals] of Object.entries(overrides)) {
    for (const [key, value] of Object.entries(vals)) {
      if (value != null) {
        declarations.push(`--${namespace}-${key}: ${value}`);
      }
    }
  }

  const css = `.${className} { ${declarations.join('; ')}; }`;
  insertRule(`theme:${name}`, css);

  return className;
}

function isThemeContractRef<T extends TokenValues>(
  value: ThemeContractRef<T> | ThemeOverrides,
): value is ThemeContractRef<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__contract' in value &&
    (value as ThemeContractRef<T>).__contract === true
  );
}

/**
 * Define a token namespace contract without injecting any CSS.
 *
 * A contract specifies the **shape** of a token namespace — the set of keys
 * that any theme based on this contract must provide. Passing a contract to
 * `tokens.createTheme()` activates TypeScript enforcement: the compiler will
 * error if any key is absent from the theme override values.
 *
 * The returned `ThemeContractRef` is also a valid `TokenRef` and can be used
 * anywhere the corresponding `tokens.create()` reference would be used (e.g.,
 * inside style objects), making contracts suitable for shared design-system
 * packages where the actual token values are provided by the consuming app.
 *
 * @param namespace - The CSS custom-property namespace (e.g. `"color"`).
 * @param shape     - An object whose keys become the required token keys.
 *                    Values are ignored at runtime; they exist only for type
 *                    inference (use empty strings `""` as placeholders).
 *
 * @example
 * ```ts
 * // packages/design-system/tokens.ts
 * export const colorContract = tokens.createContract('color', {
 *   primary: '',
 *   secondary: '',
 *   surface: '',
 * });
 *
 * // Usable directly in styles (just like tokens.create):
 * const button = styles.create('button', {
 *   base: { color: colorContract.primary },
 * });
 *
 * // packages/app/theme.ts
 * import { colorContract } from '@design-system/tokens';
 *
 * // TypeScript errors if 'secondary' or 'surface' are missing:
 * export const darkTheme = tokens.createTheme('dark', colorContract, {
 *   primary: '#66b3ff',
 *   secondary: '#aabbcc',
 *   surface: '#1a1a2e',
 * });
 * ```
 */
export function createThemeContract<T extends TokenValues>(
  namespace: string,
  shape: T,
): ThemeContractRef<T> {
  // Does NOT inject CSS — only provides a typed reference.
  // Use a Proxy with the metadata on the target so __contract / __namespace /
  // __keys are read from the real object while token keys (e.g. `.primary`)
  // still return var() strings via the get trap.
  return new Proxy(
    {
      __contract: true as const,
      __namespace: namespace,
      __keys: Object.keys(shape) as (keyof T & string)[],
    } as unknown as ThemeContractRef<T>,
    {
      get(target, prop: string | symbol): unknown {
        if (prop in target) return (target as Record<string | symbol, unknown>)[prop];
        return `var(--${namespace}-${String(prop)})`;
      },
    },
  );
}
