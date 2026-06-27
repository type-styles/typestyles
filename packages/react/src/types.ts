import type { CSSProperties } from 'typestyles';

export type CssPropValue = CSSProperties | false | null | undefined;

export type WithCssProp<P> = P & { css?: CssPropValue; className?: string };
