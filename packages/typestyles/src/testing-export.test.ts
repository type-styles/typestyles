import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('typestyles/testing dist output', () => {
  it('emits esm, cjs, and type declaration files', () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const dist = join(dir, '../dist');
    expect(existsSync(`${dist}/testing.js`)).toBe(true);
    expect(existsSync(`${dist}/testing.cjs`)).toBe(true);
    expect(existsSync(`${dist}/testing.d.ts`)).toBe(true);
    expect(existsSync(`${dist}/testing.d.cts`)).toBe(true);
  });
});
