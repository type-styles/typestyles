import { describe, it, expect, beforeEach, vi } from 'vitest';
import { insertRule, insertRules, getRegisteredCss, subscribeRegisteredCss, reset } from './sheet';
import { registeredNamespaces } from './registry';

describe('subscribeRegisteredCss', () => {
  beforeEach(() => {
    reset();
    registeredNamespaces.clear();
  });

  it('notifies listeners when a rule is registered', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeRegisteredCss(listener);

    insertRule('.a', '.a { color: red; }');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getRegisteredCss()).toContain('.a { color: red; }');

    unsubscribe();
  });

  it('notifies once per insertRules batch', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeRegisteredCss(listener);

    insertRules([
      { key: '.a', css: '.a { color: red; }' },
      { key: '.b', css: '.b { color: blue; }' },
    ]);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('does not notify for deduplicated rules', () => {
    insertRule('.a', '.a { color: red; }');

    const listener = vi.fn();
    const unsubscribe = subscribeRegisteredCss(listener);

    insertRule('.a', '.a { color: red; }');
    insertRules([{ key: '.a', css: '.a { color: red; }' }]);
    expect(listener).not.toHaveBeenCalled();

    unsubscribe();
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeRegisteredCss(listener);
    unsubscribe();

    insertRule('.a', '.a { color: red; }');
    expect(listener).not.toHaveBeenCalled();
  });
});
