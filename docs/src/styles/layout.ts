import { designTokens as t } from '@examples/design-system';
import { styles } from './typestyles';

const bp = '@media (max-width: 768px)';
const desktop = '@media (min-width: 769px)';
const tocBp = '@media (min-width: 1024px)';

/** Shared by desktop site header and mobile top bar (`space.8` + `space.2` = 56px). */
const siteHeaderHeight = `calc(${t.space[8]} + ${t.space[2]})`;

const layoutBase = styles.component(
  'docs-layout',
  {
    root: {
      display: 'flex',
      minHeight: '100vh',
      color: t.color.text.primary,
      backgroundColor: t.color.background.app,
      [desktop]: {
        paddingTop: siteHeaderHeight,
      },
    },
    content: {
      flex: 1,
      minWidth: 0,
      [bp]: {
        paddingTop: siteHeaderHeight,
      },
    },
    main: {
      maxWidth: '768px',
      padding: t.space[8],
      [bp]: {
        padding: `${t.space[5]} ${t.space[4]}`,
      },
    },
    /** Grid wrapper when `tocHeadings` are present (desktop TOC column). */
    docPageWrap: {
      maxWidth: '1100px',
      margin: '0 auto',
      width: '100%',
    },
    docPageWrapWithToc: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gridTemplateAreas: '"toc" "main"',
      [tocBp]: {
        gridTemplateColumns: 'minmax(0, 1fr) 200px',
        gridTemplateAreas: '"main toc"',
        gap: t.space[8],
        alignItems: 'start',
      },
    },
    mainColumn: {
      gridArea: 'main',
      minWidth: 0,
    },
    tocAside: {
      gridArea: 'toc',
      minWidth: 0,
      [tocBp]: {
        justifySelf: 'end',
        width: '200px',
        position: 'sticky',
        top: `calc(${siteHeaderHeight} + ${t.space[5]})`,
        maxHeight: `calc(100vh - ${siteHeaderHeight} - ${t.space[5]} - ${t.space[2]})`,
        overflowY: 'auto',
        paddingTop: t.space[2],
        paddingRight: t.space[1],
      },
    },
  },
  { layer: 'components' },
);

export const layout = layoutBase;
