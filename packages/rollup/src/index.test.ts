import { describe, expect, it } from 'vitest';
import { extractNamespaces } from './index';

describe('extractNamespaces', () => {
  it('extracts styles and tokens namespaces', () => {
    const code = `
      import { styles, tokens } from 'typestyles';
      const color = tokens.create('color', { primary: '#0066ff' });
      const button = styles.component('button', { base: { color: color.primary } });
    `;
    const result = extractNamespaces(code);
    expect(result.keys).toEqual(['tokens:color']);
    expect(result.prefixes).toEqual(['.button-']);
  });
});
