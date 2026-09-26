import type { TokenValues } from './types';
import type { TokensApi } from './tokens';

/** Token bag on {@link ThemeSurface} — `use()` plus `tokens.color`-style namespace refs. */
export type ThemeTokenContext = {
  use: TokensApi['use'];
} & Record<string, ReturnType<TokensApi['use']>>;

export function createThemeTokenContext(use: TokensApi['use']): ThemeTokenContext {
  return new Proxy({ use } as ThemeTokenContext, {
    get(target, prop, receiver) {
      if (prop === 'use') return use;
      if (typeof prop === 'string') {
        return use(prop as keyof TokenValues & string);
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}
