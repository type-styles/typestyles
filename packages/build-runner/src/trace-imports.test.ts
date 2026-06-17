import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { traceTypestylesModules } from './trace-imports';

describe('traceTypestylesModules', () => {
  it('returns modules in the import graph that import typestyles', async () => {
    const root = mkdtempSync(join(tmpdir(), 'typestyles-trace-'));
    mkdirSync(join(root, 'app'), { recursive: true });
    mkdirSync(join(root, 'styles'), { recursive: true });
    writeFileSync(
      join(root, 'styles/tokens.ts'),
      `import { tokens } from 'typestyles';\ntokens.create('trace-root', { color: { primary: '#000' } });\n`,
    );
    writeFileSync(
      join(root, 'app/page.tsx'),
      `import '../styles/tokens';\nexport default function Page() { return null; }\n`,
    );
    writeFileSync(
      join(root, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: { '@/*': ['./*'] },
        },
      }),
    );

    try {
      const modules = await traceTypestylesModules(root, ['app/page.tsx']);
      expect(modules).toContain('styles/tokens.ts');
      expect(modules).not.toContain('app/page.tsx');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('resolves tsconfig path aliases', async () => {
    const root = mkdtempSync(join(tmpdir(), 'typestyles-trace-alias-'));
    mkdirSync(join(root, 'app'), { recursive: true });
    mkdirSync(join(root, 'styles'), { recursive: true });
    writeFileSync(
      join(root, 'styles/site.ts'),
      `import { styles } from 'typestyles';\nstyles.class('site-page', { padding: '1rem' });\n`,
    );
    writeFileSync(
      join(root, 'app/page.tsx'),
      `import '@/styles/site';\nexport default function Page() { return null; }\n`,
    );
    writeFileSync(
      join(root, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: { '@/*': ['./*'] },
        },
      }),
    );

    try {
      const modules = await traceTypestylesModules(root, ['app/page.tsx']);
      expect(modules).toContain('styles/site.ts');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
