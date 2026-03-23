import type { ReactElement } from 'react';

export { getRegisteredCss } from 'typestyles/server';

export declare function collectStylesFromComponent(component: ReactElement): Promise<string>;

export declare function getTypestylesMetadata(component: ReactElement): Promise<string>;
