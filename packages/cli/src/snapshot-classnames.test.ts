import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSnapshot,
  collectPublicClassNamesSync,
  resolveProjectStylesBindings,
  semanticClassName,
} from './snapshot-classnames';

describe('snapshot-classnames', () => {
  it('computes semantic class names from component configs', () => {
    expect(semanticClassName({ mode: 'semantic', scopeId: '' }, 'button', 'base')).toBe(
      'button-base',
    );
    expect(
      semanticClassName({ mode: 'semantic', scopeId: '@acme/ui' }, 'button', 'intent-primary'),
    ).toBe('acme-ui-button-intent-primary');
    expect(semanticClassName({ mode: 'hashed', scopeId: '' }, 'button', 'base')).toBeNull();
  });

  it('resolves createTypeStyles bindings across files', () => {
    const rootDir = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../examples/design-system',
    );
    const runtimePath = path.join(rootDir, 'src/runtime.ts');
    const bindings = resolveProjectStylesBindings([runtimePath], rootDir);
    expect([...bindings.keys()]).toContain('styles');
    expect(bindings.get('styles')).toEqual({ mode: 'semantic', scopeId: 'example-ds' });
  });

  it('collects class names from the design-system button source', () => {
    const rootDir = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../examples/design-system',
    );
    const entries = collectPublicClassNamesSync({
      rootDir,
      include: ['src/runtime.ts', 'src/components/button.ts'],
    });
    const snapshot = buildSnapshot(entries);
    expect(snapshot.classNames).toContain('example-ds-button-base');
    expect(snapshot.classNames.some((name) => name.startsWith('example-ds-button-intent-'))).toBe(
      true,
    );
  });
});
