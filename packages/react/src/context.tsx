import { createContext, type ReactNode } from 'react';
import type { StylesApi } from 'typestyles';

export const TypeStylesContext = createContext<StylesApi | null>(null);

export function TypeStylesProvider({
  styles,
  children,
}: {
  styles: StylesApi;
  children: ReactNode;
}): React.JSX.Element {
  return <TypeStylesContext.Provider value={styles}>{children}</TypeStylesContext.Provider>;
}
