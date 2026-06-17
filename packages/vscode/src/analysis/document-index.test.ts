import { describe, expect, it } from 'vitest';
import { buildCssPreview, formatCssPreviewMarkdown } from './css-preview';
import { buildDocumentIndex } from './document-index';

const sample = `
import { createTypeStyles } from 'typestyles';

export const { styles, tokens } = createTypeStyles({ scopeId: 'app' });

export const color = tokens.create('color', {
  primary: '#0066ff',
  surface: '#ffffff',
});

export const button = styles.component('button', {
  base: {
    padding: '8px 16px',
    color: color.surface,
    backgroundColor: color.primary,
    '&:hover': { opacity: 0.9 },
  },
  variants: {
    intent: {
      ghost: { backgroundColor: 'transparent', color: color.primary },
    },
  },
});

export const card = styles.class('card', {
  borderRadius: '8px',
});
`;

describe('document index + css preview', () => {
  it('indexes registrations and emits semantic CSS preview', () => {
    const index = buildDocumentIndex('/project/button.ts', sample);
    expect(index.registrations).toHaveLength(2);
    expect(index.componentBindings).toHaveLength(1);
    expect(index.classNameToRegistration.get('app-button-base')).toBeDefined();

    const buttonReg = index.registrations.find((r) => r.namespace === 'button');
    expect(buttonReg).toBeDefined();
    if (!buttonReg) return;

    const preview = buildCssPreview(index, buttonReg);
    expect(preview).toBeDefined();
    if (!preview) return;
    expect(preview?.classNames).toEqual(
      expect.arrayContaining(['app-button-base', 'app-button-intent-ghost']),
    );
    expect(preview?.css).toContain('.app-button-base {');
    expect(preview?.css).toContain('background-color: #0066ff');
    expect(preview?.css).toContain('.app-button-base:hover { opacity: 0.9;');

    const markdown = formatCssPreviewMarkdown(preview);
    expect(markdown).toContain('**TypeStyles**');
    expect(markdown).toContain('```css');
  });

  it('indexes token leaves with colors', () => {
    const index = buildDocumentIndex('/project/button.ts', sample);
    const colorNs = index.tokenNamespaces.find((ns) => ns.namespace === 'color');
    expect(colorNs?.leaves).toHaveLength(2);
    expect(colorNs?.leaves[0]?.color).toBe('#0066ff');
  });
});
