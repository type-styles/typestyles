import { createContext, type ReactNode } from 'react';
import type { CssStylesHost } from './resolve-hash-class';

export const TypeStylesContext = createContext<CssStylesHost | null>(null);

export function TypeStylesProvider({
  styles,
  children,
}: {
  /** Prefer a `createTypeStyles()` result; `createStyles()` instances also work. */
  styles: CssStylesHost;
  children: ReactNode;
}): React.JSX.Element {
  return <TypeStylesContext.Provider value={styles}>{children}</TypeStylesContext.Provider>;
}
