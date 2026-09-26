import { describe, it, expect, beforeEach } from 'vitest';
import { reset } from './sheet';
import { createStyles } from './styles';
import { createTypeStyles } from './create-type-styles';
import { getComponentMeta } from './component-meta';
import { getRegisteredComponentRefs } from './component-registry';

describe('component registry', () => {
  beforeEach(() => {
    reset();
  });

  it('registers components by namespace on createStyles', () => {
    const styles = createStyles({ scopeId: 'reg' });
    const button = styles.component('button', { base: { color: 'red' } });
    const hidden = styles.component(
      'visually-hidden',
      { base: { clip: 'rect(0,0,0,0)' } },
      {
        themeable: false,
      },
    );

    expect(styles.getComponent('button')).toBe(button);
    expect(styles.getComponent('missing')).toBeUndefined();
    expect(styles.listComponentNamespaces()).toEqual(['button', 'visually-hidden']);
    expect([...styles.getThemeableComponents().keys()]).toEqual(['button']);
    expect(getComponentMeta(button)?.namespace).toBe('button');
  });

  it('does not share registry across createTypeStyles instances', () => {
    const a = createTypeStyles({ scopeId: 'a' });
    const b = createTypeStyles({ scopeId: 'b' });
    a.styles.component('card', { base: { padding: '1rem' } });
    b.styles.component('card', { base: { padding: '2rem' } });

    expect(a.styles.getComponent('card')).not.toBe(b.styles.getComponent('card'));
  });

  it('getRegisteredComponentRefs returns themeable handles keyed by namespace', () => {
    const styles = createStyles({ scopeId: 'refs' });
    const button = styles.component('button', { base: { color: 'blue' } });
    styles.component('util', { base: { display: 'none' } }, { themeable: false });
    expect(getRegisteredComponentRefs(styles)).toEqual({ button });
  });

  it('replaces duplicate namespace on the same instance', () => {
    const styles = createStyles({ scopeId: 'dup' });
    const first = styles.component('chip', { base: { color: 'a' } });
    const second = styles.component('chip', { base: { color: 'b' } });
    expect(styles.getComponent('chip')).toBe(second);
    expect(styles.getComponent('chip')).not.toBe(first);
  });
});
