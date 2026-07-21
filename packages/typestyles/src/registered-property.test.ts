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

  it('skips @property when the value contains var() (Chromium invalidates dependents incorrectly for registered inherits:false bridges)', () => {
    registerAtPropertyRule('--ts-test-var', {
      value: 'var(--ts-token-ref)',
      syntax: '<color>',
      inherits: false,
    });
    const css = getRegisteredCss();
    expect(css).not.toContain('@property --ts-test-var');
    expect(css).not.toContain('initial-value: var(--ts-token-ref)');
  });

  it('skips @property for env() values as not computationally independent', () => {
    registerAtPropertyRule('--ts-test-env', {
      value: 'env(safe-area-inset-top)',
      syntax: '<length>',
      inherits: true,
    });
    const css = getRegisteredCss();
    expect(css).not.toContain('@property --ts-test-env');
    expect(css).not.toContain('initial-value: env(safe-area-inset-top)');
  });

  it('keeps the :root default assignment for var() values without registering @property', () => {
    registerRegisteredProperty('--ts-test-root', {
      value: 'var(--ts-token-ref)',
      syntax: '<color>',
    });
    const css = getRegisteredCss();
    expect(css).toContain(':root { --ts-test-root: var(--ts-token-ref); }');
    expect(css).not.toContain('@property --ts-test-root');
  });
});
