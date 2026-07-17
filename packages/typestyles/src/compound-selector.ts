/**
 * Join alternative selector fragments for one compound dimension.
 * Single fragment stays bare; multiple become `:is(a, b, …)` — shared by recipe
 * compounds and `styles.override()` so emission stays aligned.
 */
export function joinSelectorAlternatives(fragments: string[]): string {
  if (fragments.length === 0) return '';
  const first = fragments[0];
  if (fragments.length === 1 && first != null) return first;
  return `:is(${fragments.join(', ')})`;
}
