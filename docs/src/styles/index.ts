import { proseContent } from '@examples/design-system';

/** Compose with `doc.content` on markdown bodies — registers prose CSS before doc overrides. */
export const docProseRoot = proseContent.root;

export { layout } from './layout';
export { sidebar } from './sidebar';
export { mobileBar } from './mobileBar';
export { doc } from './doc';
export { skipLink } from './skipLink';
export { toc } from './toc';
export { docPage } from './docPage';
export { home } from './home';
export * from './global';
