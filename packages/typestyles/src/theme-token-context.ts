/** Runtime `tokens.use` on theme surfaces (keeps DTS independent of generic `TokensApi<R>`). */
export type ThemeTokenUseFn = (namespaceOrRef: string) => unknown;

/** Token bag on {@link ThemeSurface} — `use()` plus `tokens.color`-style namespace refs. */
export type ThemeTokenContext = {
  use: ThemeTokenUseFn;
} & Record<string, unknown>;

export function createThemeTokenContext(use: ThemeTokenUseFn): ThemeTokenContext {
  return new Proxy({ use } as ThemeTokenContext, {
    get(target, prop, receiver) {
      if (prop === 'use') return use;
      if (typeof prop === 'string') {
        return use(prop);
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}
