import { describe, it, expect, beforeEach } from 'vitest';
import { registerAtPropertyRule, registerRegisteredProperty } from './registered-property';
import { getRegisteredCss, reset } from './sheet';

describe('registerAtPropertyRule', () => {
  beforeEach(() => {
    reset();
  });

  it('emits a typed @property with initial-value for computationally independent values', () => {
    registerAtPropertyRule('--ts-test-literal', { value: '#fff', syntax: '<color>' });
    expect(getRegisteredCss()).toContain(
      '@property --ts-test-literal { syntax: "<color>"; inherits: false; initial-value: #fff; }',
    );
  });

  it('degrades to universal syntax without initial-value when the value contains var()', () => {
    registerAtPropertyRule('--ts-test-var', {
      value: 'var(--ts-token-ref)',
      syntax: '<color>',
      inherits: false,
    });
    const css = getRegisteredCss();
    expect(css).toContain('@property --ts-test-var { syntax: "*"; inherits: false; }');
    expect(css).not.toContain('initial-value: var(--ts-token-ref)');
  });

  it('treats env() values as not computationally independent', () => {
    registerAtPropertyRule('--ts-test-env', {
      value: 'env(safe-area-inset-top)',
      syntax: '<length>',
      inherits: true,
    });
    const css = getRegisteredCss();
    expect(css).toContain('@property --ts-test-env { syntax: "*"; inherits: true; }');
    expect(css).not.toContain('initial-value: env(safe-area-inset-top)');
  });

  it('keeps the :root default assignment for var() values', () => {
    registerRegisteredProperty('--ts-test-root', {
      value: 'var(--ts-token-ref)',
      syntax: '<color>',
    });
    expect(getRegisteredCss()).toContain(':root { --ts-test-root: var(--ts-token-ref); }');
  });
});
