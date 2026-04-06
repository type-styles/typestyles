import { describe, it, expect, beforeEach } from 'vitest';
import { globalStyle, globalFontFace } from './global';
import { reset, flushSync, getRegisteredCss } from './sheet';

describe('globalStyle', () => {
  beforeEach(() => {
    reset();
  });

  it('injects a rule for a plain selector', () => {
    globalStyle('body', { margin: 0, padding: 0 });
    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('body {');
    expect(css).toContain('margin: 0');
    expect(css).toContain('padding: 0');
  });

  it('injects rules for pseudo-selectors', () => {
    globalStyle('a:hover', { textDecoration: 'underline' });
    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('a:hover');
    expect(css).toContain('text-decoration: underline');
  });

  it('injects rules for complex selectors', () => {
    globalStyle('*, *::before, *::after', { boxSizing: 'border-box' });
    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('box-sizing: border-box');
  });

  it('deduplicates identical rules', () => {
    globalStyle('body', { margin: 0 });
    globalStyle('body', { margin: 0 });
    flushSync();

    const css = getRegisteredCss();
    // Only one body rule should be present
    const count = (css.match(/body \{/g) ?? []).length;
    expect(count).toBe(1);
  });

  it('injects into the DOM stylesheet', () => {
    globalStyle('html', { fontSize: '16px' });
    flushSync();

    const style = document.getElementById('typestyles') as HTMLStyleElement;
    expect(style).not.toBeNull();
    const rules = Array.from(style.sheet?.cssRules ?? []) as CSSStyleRule[];
    const selectors = rules.map((r) => r.selectorText);
    expect(selectors).toContain('html');
  });
});

describe('globalFontFace', () => {
  beforeEach(() => {
    reset();
  });

  it('injects a @font-face rule', () => {
    globalFontFace('Inter', {
      src: "url('/Inter.woff2') format('woff2')",
      fontWeight: 400,
      fontStyle: 'normal',
      fontDisplay: 'swap',
    });
    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('@font-face');
    expect(css).toContain('font-family: "Inter"');
    expect(css).toContain("url('/Inter.woff2') format('woff2')");
    expect(css).toContain('font-weight: 400');
    expect(css).toContain('font-style: normal');
    expect(css).toContain('font-display: swap');
  });

  it('allows multiple weights for the same family', () => {
    globalFontFace('Inter', {
      src: "url('/Inter-Regular.woff2') format('woff2')",
      fontWeight: 400,
    });
    globalFontFace('Inter', {
      src: "url('/Inter-Bold.woff2') format('woff2')",
      fontWeight: 700,
    });
    flushSync();

    const css = getRegisteredCss();
    const count = (css.match(/@font-face/g) ?? []).length;
    expect(count).toBe(2);
  });

  it('deduplicates identical font-face declarations', () => {
    const src = "url('/Inter.woff2') format('woff2')";
    globalFontFace('Inter', { src });
    globalFontFace('Inter', { src });
    flushSync();

    const css = getRegisteredCss();
    const count = (css.match(/@font-face/g) ?? []).length;
    expect(count).toBe(1);
  });

  it('includes optional properties when provided', () => {
    globalFontFace('MyFont', {
      src: "url('/MyFont.woff2') format('woff2')",
      fontStretch: 'condensed',
      unicodeRange: 'U+0000-00FF',
    });
    flushSync();

    const css = getRegisteredCss();
    expect(css).toContain('font-stretch: condensed');
    expect(css).toContain('unicode-range: U+0000-00FF');
  });
});
