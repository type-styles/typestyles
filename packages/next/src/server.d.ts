import type { ReactElement } from 'react';
import type { GetRouteCssOptions } from '@typestyles/build-runner';

export { getRegisteredCss } from 'typestyles/server';
export { getRouteCss, type GetRouteCssOptions };

export declare function collectStylesFromComponent(component: ReactElement): Promise<string>;

export declare function getTypestylesMetadata(component: ReactElement): Promise<string>;
