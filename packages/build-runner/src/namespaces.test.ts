import { describe, expect, it } from 'vitest';
import { extractNamespaces, moduleNeedsOverrideHmr, TYPESTYLES_IMPORT_RE } from './namespaces';

describe('extractNamespaces', () => {
  it('extracts component and token namespaces', () => {
    const code = `
      import { styles, tokens } from 'typestyles';
      tokens.create('color', { primary: '#0066ff' });
      styles.component('button', { base: { color: 'red' } });
    `;
    const result = extractNamespaces(code);
    expect(result.keys).toEqual(['tokens:color']);
    expect(result.prefixes).toEqual(['.button-']);
  });

  it('matches typestyles package imports', () => {
    expect(TYPESTYLES_IMPORT_RE.test("import { styles } from 'typestyles'")).toBe(true);
    expect(TYPESTYLES_IMPORT_RE.test("import { styles } from './typestyles'")).toBe(false);
  });
});

describe('moduleNeedsOverrideHmr', () => {
  it('detects styles.override and design-system sugar', () => {
    expect(moduleNeedsOverrideHmr('styles.override(button, { base: {} });')).toBe(true);
    expect(moduleNeedsOverrideHmr('export const acme = createDesignTheme({ name: "acme" });')).toBe(
      true,
    );
    expect(moduleNeedsOverrideHmr('overrideComponent(button, { base: {} });')).toBe(true);
    expect(moduleNeedsOverrideHmr("styles.component('button', { base: {} });")).toBe(false);
  });
});
