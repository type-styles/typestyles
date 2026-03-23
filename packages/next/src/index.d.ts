import type { ReactElement, ReactNode } from 'react';

export { getRegisteredCss } from 'typestyles/server';

export interface TypestylesStylesheetProps {
  children?: ReactNode;
}

export function TypestylesStylesheet(props: TypestylesStylesheetProps): React.JSX.Element;

export function collectStylesFromComponent(component: ReactElement): Promise<string>;

export function createTypestylesLayout<P extends { children?: ReactNode }>(
  layout: (props: P) => ReactNode,
): (props: P) => React.JSX.Element;
