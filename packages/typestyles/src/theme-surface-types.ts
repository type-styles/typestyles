import type {
  CreateTokenValues,
  ThemeComponentOverrideEntry,
  ThemeConfig,
  ThemeOverrideContext,
} from './types';

type TokensMap = Record<string, CreateTokenValues>;

/** Empty tokens map without a string index signature (avoids `keyof` → `string` in merges). */
type NoTokens = Record<never, CreateTokenValues>;

/** Deep-merge two token value trees at the type level (matches runtime `mergeTokenValues`). */
export type MergeCreateTokenValues<A, B> =
  A extends Record<string, unknown>
    ? B extends Record<string, unknown>
      ? {
          [K in keyof A | keyof B]: K extends keyof B
            ? K extends keyof A
              ? MergeCreateTokenValues<A[K], B[K]>
              : B[K]
            : K extends keyof A
              ? A[K]
              : never;
        }
      : B
    : B;

type MergeTwoTokensMaps<L extends TokensMap, R extends TokensMap> = Omit<L, keyof R> & {
  [K in keyof R]: K extends keyof L ? MergeCreateTokenValues<L[K], R[K]> : R[K];
};

type TokensFromPreset<P> = P extends { tokens: infer T extends TokensMap } ? T : NoTokens;

type TokensFromOptional<T> = T extends TokensMap ? T : NoTokens;

/**
 * Merged `tokens` namespaces from a `createTheme` config (`tokens`, `from.tokens`).
 */
export type InferThemeTokensFromConfig<C extends Pick<ThemeConfig, 'tokens' | 'from'>> =
  MergeTwoTokensMaps<TokensFromPreset<C['from']>, TokensFromOptional<C['tokens']>>;

/** Typed `components` map for `createTheme` (factories see `ctx.tokens` from `tokens` / presets). */
export type ThemeComponentsFor<T extends Pick<ThemeConfig, 'tokens' | 'from'>> = {
  components?: Record<
    string,
    | ThemeComponentOverrideEntry
    | ((ctx: ThemeOverrideContext<InferThemeTokensFromConfig<T>>) => ThemeComponentOverrideEntry)
  >;
};

type CreateThemeConfigFields = Omit<ThemeConfig, 'components'>;

/**
 * Single argument to `tokens.createTheme()` — theme name, token layers, optional recipe overrides.
 *
 * - **`tokens`** — per-namespace values on `.theme-{name}` (registers namespaces for `surface.tokens` refs).
 * - **`colorMode` / `modes`** — light/dark and conditional override layers (see theming docs).
 * - **`from`** — preset; sibling fields deep-merge onto it before compile.
 * - **`components`** — per-recipe CSS overrides scoped to this theme class.
 * - **`replace`** — when true (default), reusing `name` replaces the previous theme registration.
 */
export type CreateThemeInput<T extends CreateThemeConfigFields = CreateThemeConfigFields> = {
  name: string;
  replace?: boolean;
} & T &
  ThemeComponentsFor<T>;
