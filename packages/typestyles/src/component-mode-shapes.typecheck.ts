/**
 * Compile-only fixtures (included in `tsc --noEmit`, not shipped in the bundle entry).
 * Verifies createStyles({ mode: 'attribute' }) narrows styles.component()'s return type and
 * rejects `slots` — see specs/attribute-driven-variants.md.
 */
import { createStyles } from './styles';

const attributeStyles = createStyles({ mode: 'attribute' });

export function _attributeComponentReturnsAttrsResult() {
  const button = attributeStyles.component('shape-button', {
    base: { padding: '8px' },
    variants: { variant: { primary: { color: 'blue' } } },
  });
  const b = button({ variant: 'primary' });
  // Only compiles if `b` is ComponentAttrsResult, not a plain string.
  return b.attrs;
}

export function _attributeComponentRejectsSlots() {
  // @ts-expect-error — `slots` has no matching overload under mode: 'attribute'.
  return attributeStyles.component('shape-dialog', {
    slots: ['root', 'trigger'],
    base: { root: { display: 'grid' } },
  });
}

const bemStyles = createStyles({ mode: 'bem' });

export function _bemComponentReturnsPlainString() {
  const button = bemStyles.component('shape-bem-button', {
    base: { padding: '8px' },
    variants: { variant: { primary: { color: 'blue' } } },
  });
  // Only compiles if this is a plain string (mode: 'bem' needs no new return type).
  const cls: string = button({ variant: 'primary' });
  return cls;
}

export function _bemComponentAcceptsSlots() {
  return bemStyles.component('shape-bem-dialog', {
    slots: ['root', 'trigger'],
    base: { root: { display: 'grid' } },
  });
}
