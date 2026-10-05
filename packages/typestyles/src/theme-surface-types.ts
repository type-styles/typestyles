import type {
  CreateTokenValues,
  ThemeComponentOverrideEntry,
  ThemeConfig,
  ThemeOverrideContext,
} from './types';

type ExtendMap = Record<string, CreateTokenValues>;

/** Empty extend map without a string index signature (avoids `keyof` → `string` in merges). */
type NoExtend = Record<never, CreateTokenValues>;

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

type MergeTwoExtendMaps<L extends ExtendMap, R extends ExtendMap> = Omit<L, keyof R> & {
  [K in keyof R]: K extends keyof L ? MergeCreateTokenValues<L[K], R[K]> : R[K];
};

type ExtendFromPreset<P> = P extends { extend: infer E extends ExtendMap } ? E : NoExtend;

type ExtendFromOptional<E> = E extends ExtendMap ? E : NoExtend;

/**
 * Merged `extend` namespaces from a `createTheme` config (`extend`, `from.extend`, `patch.extend`).
 */
export type InferThemeExtendFromConfig<C extends ThemeConfig> = MergeTwoExtendMaps<
  MergeTwoExtendMaps<ExtendFromPreset<C['from']>, ExtendFromPreset<C['patch']>>,
  ExtendFromOptional<C['extend']>
>;

/** Config argument shape so `components` factories see typed `ctx.tokens` for `extend` keys. */
export type ThemeConfigInput<C extends ThemeConfig = ThemeConfig> = Omit<C, 'components'> & {
  components?: Record<
    string,
    | ThemeComponentOverrideEntry
    | ((ctx: ThemeOverrideContext<InferThemeExtendFromConfig<C>>) => ThemeComponentOverrideEntry)
  >;
};
