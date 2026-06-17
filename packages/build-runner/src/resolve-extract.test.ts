import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { resolveExtractMode, resolveExtractModules } from './resolve-extract';

describe('resolveExtractModules', () => {
  it('returns explicit modules when configured', () => {
    const root = mkdtempSync(join(tmpdir(), 'typestyles-resolve-'));
    expect(resolveExtractModules(root, { modules: ['a.ts', 'b.ts'] })).toEqual(['a.ts', 'b.ts']);
  });

  it('discovers convention entries when modules are omitted', () => {
    const root = mkdtempSync(join(tmpdir(), 'typestyles-resolve-'));
    mkdirSync(join(root, 'src'), { recursive: true });
    writeFileSync(join(root, 'src/typestyles-entry.ts'), "import 'typestyles';\n");
    expect(resolveExtractModules(root, undefined)).toEqual(['src/typestyles-entry.ts']);
  });
});

describe('resolveExtractMode', () => {
  it('defaults to build when modules resolve', () => {
    expect(resolveExtractMode(undefined, ['src/typestyles-entry.ts'])).toBe('build');
  });

  it('defaults to runtime when no modules resolve', () => {
    expect(resolveExtractMode(undefined, [])).toBe('runtime');
  });

  it('honors an explicit mode', () => {
    expect(resolveExtractMode('hybrid', ['src/typestyles-entry.ts'])).toBe('hybrid');
  });
});
