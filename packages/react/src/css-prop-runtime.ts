import type { CSSProperties } from 'typestyles';

export function cssProp(
  styles: { hashClass: (properties: CSSProperties, label?: string) => string },
  properties: CSSProperties,
): string {
  return styles.hashClass(properties);
}
