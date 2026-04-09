import { createTypeStyles } from 'typestyles';

export const { styles, tokens } = createTypeStyles({
  scopeId: 'docs',
  mode: 'semantic',
});

export const docsTokens = tokens.create('docs', {
  size: {
    sidebarWidth: '280px',
    mobileHeaderHeight: '56px',
    mobileIconButton: '36px',
    contentMaxWidth: '768px',
    pageMaxWidth: '1100px',
    tocColumnWidth: '200px',
    tocStickyTop: '64px',
    heroTitle: '56px',
    titleLarge: '32px',
    subtitle: '20px',
    subtitleMaxWidth: '540px',
    ctaText: '15px',
    insetXs: '10px',
    borderThin: '2px',
    lineHeightTight: '16px',
  },
});
