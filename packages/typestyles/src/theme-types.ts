import type {
  CreateTokenValues,
  ThemeComponentOverrideEntry,
  ThemeConfig,
  ThemeOverrideContext,
  ThemeSource,
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

type TokensFromOptional<T> = T extends TokensMap ? T : NoTokens;

type TokensFromColorModePatches<C> = C extends {
  colorMode?: { light?: infer L; dark?: infer D };
}
  ? MergeTwoTokensMaps<L extends TokensMap ? L : NoTokens, D extends TokensMap ? D : NoTokens>
  : NoTokens;

/**
 * Merged token namespaces from a `createTheme` config (`tokens` + `colorMode` trees).
 * Used as {@link Theme}'s type parameter so {@link Theme.override} can constrain patches.
 */
export type InferThemeTokensFromConfig<C extends Pick<ThemeConfig, 'tokens' | 'colorMode'>> =
  MergeTwoTokensMaps<TokensFromOptional<C['tokens']>, TokensFromColorModePatches<C>>;

/** Typed `components` map for `createTheme` (factories see `ctx.tokens` from `tokens` / colorMode). */
export type ThemeComponentsFor<T extends Pick<ThemeConfig, 'tokens' | 'colorMode'>> = {
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
 * - **`tokens`** — per-namespace values on `.theme-{name}` (registers namespaces for `theme.tokens` refs).
 * - **`colorMode` / `modes`** — light/dark and conditional override layers (see theming docs).
 * - **`components`** — per-recipe CSS overrides scoped to this theme class.
 * - **`replace`** — when true (default), reusing `name` replaces the previous theme registration.
 *
 * Fork child themes with {@link Theme.override}, not a second `createTheme` merge API.
 */
export type CreateThemeInput<T extends CreateThemeConfigFields = CreateThemeConfigFields> = {
  name: string;
  replace?: boolean;
} & T &
  ThemeComponentsFor<T>;

/** Build a {@link ThemeSource} snapshot from a resolved theme config (no `components`). */
export function themeConfigToSource(config: Pick<ThemeConfig, keyof ThemeSource>): ThemeSource {
  const source: ThemeSource = {};
  if (config.tokens !== undefined) source.tokens = config.tokens;
  if (config.colorMode !== undefined) source.colorMode = config.colorMode;
  if (config.modes !== undefined) source.modes = config.modes;
  return source;
}
