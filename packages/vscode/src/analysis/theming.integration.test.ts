import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildDocumentIndex,
  buildTokenPreviewForLeaf,
  buildTokenPreviewForReference,
} from './document-index';
import { colorSwatchMarkdown, formatTokenPreviewMarkdown } from './token-preview';
import { createSourceFile } from './ast-utils';
import { collectThemeDefinitions } from './theme-index';

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../docs/src/demos/theming-light-dark.ts',
);

describe('theming-light-dark.ts integration', () => {
  const content = readFileSync(fixturePath, 'utf8');
  const filePath = fixturePath;

  it('collects dark theme overrides for token paths', () => {
    const index = buildDocumentIndex(filePath, content);
    expect(index.themes).toHaveLength(1);
    expect(index.themes[0]?.name).toBe('dark');
    expect(index.themes[0]?.modes[0]?.overrides.get('theme.primary')).toBe('#66b3ff');
  });

  it('shows default and dark variants with swatches for token references', () => {
    const index = buildDocumentIndex(filePath, content);
    const preview = buildTokenPreviewForReference(index, 'themeColor.primary');
    expect(preview).toBeDefined();
    expect(preview?.cssVar).toBe('--theme-primary');
    expect(preview?.variants).toHaveLength(2);
    expect(preview?.variants[0]).toMatchObject({ label: 'Default', value: '#0066ff' });
    expect(preview?.variants[1]).toMatchObject({ label: 'Theme base', value: '#66b3ff' });

    const markdown = formatTokenPreviewMarkdown(preview!);
    expect(markdown).toContain('data:image/svg+xml');
    expect(markdown).toContain('**Default**');
    expect(markdown).toContain('**Theme base**');
  });

  it('includes swatches on token definition hovers', () => {
    const index = buildDocumentIndex(filePath, content);
    const leaf = index.tokenNamespaces[0]?.leaves.find(
      (item) => item.path.join('.') === 'theme.primary',
    );
    expect(leaf).toBeDefined();
    const preview = buildTokenPreviewForLeaf(index, leaf!);
    expect(preview?.variants.length).toBeGreaterThanOrEqual(2);
    expect(colorSwatchMarkdown('#0066ff')).toContain('data:image/svg+xml');
  });

  it('expands colorMode.systemWithLightDarkOverride presets', () => {
    const source = `
import { createTokens } from 'typestyles';
const tokens = createTokens();
const color = tokens.create('color', { bg: '#fff', fg: '#111' });
const light = { color: { bg: '#fff', fg: '#111' } };
const dark = { color: { bg: '#111', fg: '#eee' } };
tokens.createTheme('app', {
  base: light,
  colorMode: tokens.colorMode.systemWithLightDarkOverride({
    attribute: 'data-mode',
    values: { light: 'light', dark: 'dark' },
    scope: 'self',
    light,
    dark,
  }),
});
`;
    const themes = collectThemeDefinitions(createSourceFile('theme.ts', source), new Map());
    expect(themes[0]?.modes.some((mode) => mode.label === 'Dark')).toBe(true);
    expect(themes[0]?.modes.some((mode) => mode.label === 'Light')).toBe(true);
    expect(themes[0]?.modes.find((mode) => mode.label === 'Dark')?.overrides.get('color.bg')).toBe(
      '#111',
    );
  });
});
