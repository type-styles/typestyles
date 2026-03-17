import { describe, it, expect } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { runTypestylesBuild } from '@typestyles/build-runner';
import { flushSync, getRegisteredCss, reset } from 'typestyles';
import { extractNamespaces } from './index.js';

describe('extractNamespaces', () => {
  it('extracts styles.create namespaces as prefixes', () => {
    const code = `
      import { styles } from 'typestyles';
      const button = styles.create('button', {
        base: { color: 'red' },
      });
    `;
    const result = extractNamespaces(code);
    expect(result.prefixes).toEqual(['.button-']);
    expect(result.keys).toEqual([]);
  });

  it('extracts tokens.create namespaces as keys', () => {
    const code = `
      import { tokens } from 'typestyles';
      const color = tokens.create('color', { primary: '#0066ff' });
    `;
    const result = extractNamespaces(code);
    expect(result.keys).toEqual(['tokens:color']);
    expect(result.prefixes).toEqual([]);
  });

  it('extracts createTheme as theme keys', () => {
    const code = `
      import { tokens } from 'typestyles';
      const dark = tokens.createTheme('dark', { color: { primary: '#fff' } });
    `;
    const result = extractNamespaces(code);
    expect(result.keys).toEqual(['theme:dark']);
  });

  it('extracts standalone createTheme calls', () => {
    const code = `
      import { createTheme } from 'typestyles';
      const dark = createTheme('dark', { color: { primary: '#fff' } });
    `;
    const result = extractNamespaces(code);
    expect(result.keys).toEqual(['theme:dark']);
  });

  it('extracts keyframes.create as keyframe keys', () => {
    const code = `
      import { keyframes } from 'typestyles';
      const fadeIn = keyframes.create('fadeIn', {
        from: { opacity: 0 },
        to: { opacity: 1 },
      });
    `;
    const result = extractNamespaces(code);
    expect(result.keys).toEqual(['keyframes:fadeIn']);
    expect(result.prefixes).toEqual([]);
  });

  it('extracts multiple namespaces from a single module', () => {
    const code = `
      import { styles, tokens, keyframes } from 'typestyles';
      const color = tokens.create('color', { primary: '#0066ff' });
      const fadeIn = keyframes.create('fadeIn', { from: { opacity: 0 }, to: { opacity: 1 } });
      const button = styles.create('button', { base: { color: color.primary } });
      const card = styles.create('card', { base: { animation: fadeIn } });
    `;
    const result = extractNamespaces(code);
    expect(result.keys).toEqual(['tokens:color', 'keyframes:fadeIn']);
    expect(result.prefixes).toEqual(['.button-', '.card-']);
  });

  it('handles double-quoted strings', () => {
    const code = `
      const button = styles.create("button", { base: { color: 'red' } });
    `;
    const result = extractNamespaces(code);
    expect(result.prefixes).toEqual(['.button-']);
  });

  it('extracts styles.component namespaces as prefixes', () => {
    const code = `
      import { styles } from 'typestyles';
      const button = styles.component('button', {
        base: { color: 'red' },
      });
    `;
    const result = extractNamespaces(code);
    expect(result.prefixes).toEqual(['.button-']);
    expect(result.keys).toEqual([]);
  });

  it('extracts global.style selectors as prefixes', () => {
    const code = `
      import { global } from 'typestyles';
      global.style('body', { margin: 0 });
    `;
    const result = extractNamespaces(code);
    expect(result.prefixes).toEqual(['body']);
    expect(result.keys).toEqual([]);
  });

  it('extracts global.fontFace as font-face prefixes', () => {
    const code = `
      import { global } from 'typestyles';
      global.fontFace('Inter', { src: "url('/Inter.woff2')" });
    `;
    const result = extractNamespaces(code);
    expect(result.prefixes).toEqual(['font-face:Inter']);
    expect(result.keys).toEqual([]);
  });

  it('returns empty arrays for code with no typestyles calls', () => {
    const code = `
      const x = 1 + 2;
      console.log(x);
    `;
    const result = extractNamespaces(code);
    expect(result.keys).toEqual([]);
    expect(result.prefixes).toEqual([]);
  });
});

describe('typestyles vite plugin', () => {
  it('exports a default function', async () => {
    const mod = await import('./index.js');
    expect(typeof mod.default).toBe('function');
  });

  it('returns a plugin object with correct name', async () => {
    const mod = await import('./index.js');
    const plugin = mod.default();
    expect(plugin.name).toBe('typestyles');
  });
});

describe('runtime/build parity', () => {
  it('emits identical CSS for component variant APIs', async () => {
    const projectRoot = process.cwd();
    const tempDir = await mkdtemp(join(tmpdir(), 'typestyles-parity-'));
    const entryFile = join(tempDir, 'entry.ts');

    await writeFile(
      entryFile,
      `
import { styles } from 'typestyles';

styles.component('parity-button', {
  base: { padding: '8px', borderWidth: '1px', borderStyle: 'solid' },
  variants: {
    intent: {
      primary: { color: 'white', backgroundColor: 'blue' },
      ghost: { color: 'blue', backgroundColor: 'transparent' },
    },
    outlined: {
      true: { borderColor: 'currentColor' },
      false: { borderColor: 'transparent' },
    },
  },
  compoundVariants: [
    { variants: { intent: ['primary', 'ghost'], outlined: true }, style: { fontWeight: 700 } },
  ],
  defaultVariants: { intent: 'primary', outlined: false },
});

`,
      'utf8',
    );

    const modulePath = pathToFileURL(entryFile).href;
    const moduleForBuild = relative(projectRoot, entryFile);

    try {
      reset();
      await import(`${modulePath}?runtime=${Date.now()}`);
      flushSync();
      const runtimeCss = getRegisteredCss();

      reset();
      const buildCss = await runTypestylesBuild({
        root: projectRoot,
        modules: [moduleForBuild],
      });

      expect(buildCss).toBe(runtimeCss);
    } finally {
      reset();
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
