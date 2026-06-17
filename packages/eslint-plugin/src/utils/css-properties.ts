/**
 * CSS properties that accept unitless numbers in TypeStyles serialization.
 * Keep in sync with `packages/typestyles/src/css.ts`.
 */
export const UNITLESS_PROPERTIES = new Set([
  'animationIterationCount',
  'aspectRatio',
  'borderImageOutset',
  'borderImageSlice',
  'borderImageWidth',
  'boxFlex',
  'boxFlexGroup',
  'boxOrdinalGroup',
  'columnCount',
  'columns',
  'flex',
  'flexGrow',
  'flexPositive',
  'flexShrink',
  'flexNegative',
  'flexOrder',
  'fontSizeAdjust',
  'fontWeight',
  'gridArea',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnSpan',
  'gridColumnStart',
  'gridRow',
  'gridRowEnd',
  'gridRowSpan',
  'gridRowStart',
  'initialLetter',
  'lineClamp',
  'lineHeight',
  'maskBorderOutset',
  'maskBorderSlice',
  'maskBorderWidth',
  'opacity',
  'order',
  'orphans',
  'scale',
  'tabSize',
  'widows',
  'zIndex',
  'zoom',
  'fillOpacity',
  'floodOpacity',
  'stopOpacity',
  'strokeDasharray',
  'strokeDashoffset',
  'strokeMiterlimit',
  'strokeOpacity',
  'strokeWidth',
]);

const VENDOR_PREFIX_RE = /^(Webkit|Moz|ms|O)([A-Z])(.*)$/;

export function isUnitlessProperty(prop: string): boolean {
  if (UNITLESS_PROPERTIES.has(prop)) return true;
  const match = VENDOR_PREFIX_RE.exec(prop);
  if (match) {
    return UNITLESS_PROPERTIES.has(match[2].toLowerCase() + match[3]);
  }
  return false;
}

/** Shorthand property → longhands that must not appear in the same style object. */
export const SHORTHAND_TO_LONGHANDS: Readonly<Record<string, readonly string[]>> = {
  padding: [
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'paddingInline',
    'paddingBlock',
    'paddingInlineStart',
    'paddingInlineEnd',
    'paddingBlockStart',
    'paddingBlockEnd',
  ],
  margin: [
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'marginInline',
    'marginBlock',
    'marginInlineStart',
    'marginInlineEnd',
    'marginBlockStart',
    'marginBlockEnd',
  ],
  border: [
    'borderWidth',
    'borderStyle',
    'borderColor',
    'borderTop',
    'borderRight',
    'borderBottom',
    'borderLeft',
    'borderInline',
    'borderBlock',
  ],
  borderWidth: [
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderInlineWidth',
    'borderBlockWidth',
  ],
  borderStyle: ['borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle'],
  borderColor: ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'],
  borderTop: ['borderTopWidth', 'borderTopStyle', 'borderTopColor'],
  borderRight: ['borderRightWidth', 'borderRightStyle', 'borderRightColor'],
  borderBottom: ['borderBottomWidth', 'borderBottomStyle', 'borderBottomColor'],
  borderLeft: ['borderLeftWidth', 'borderLeftStyle', 'borderLeftColor'],
  background: [
    'backgroundColor',
    'backgroundImage',
    'backgroundPosition',
    'backgroundSize',
    'backgroundRepeat',
    'backgroundAttachment',
    'backgroundOrigin',
    'backgroundClip',
  ],
  font: ['fontStyle', 'fontVariant', 'fontWeight', 'fontSize', 'lineHeight', 'fontFamily'],
  flex: ['flexGrow', 'flexShrink', 'flexBasis'],
  gap: ['rowGap', 'columnGap'],
  overflow: ['overflowX', 'overflowY'],
  transition: [
    'transitionProperty',
    'transitionDuration',
    'transitionTimingFunction',
    'transitionDelay',
  ],
  animation: [
    'animationName',
    'animationDuration',
    'animationTimingFunction',
    'animationDelay',
    'animationIterationCount',
    'animationDirection',
    'animationFillMode',
    'animationPlayState',
  ],
  outline: ['outlineWidth', 'outlineStyle', 'outlineColor'],
  listStyle: ['listStyleType', 'listStylePosition', 'listStyleImage'],
  grid: [
    'gridTemplateRows',
    'gridTemplateColumns',
    'gridTemplateAreas',
    'gridAutoRows',
    'gridAutoColumns',
    'gridAutoFlow',
  ],
  gridTemplate: ['gridTemplateRows', 'gridTemplateColumns', 'gridTemplateAreas'],
  inset: ['top', 'right', 'bottom', 'left'],
  insetBlock: ['insetBlockStart', 'insetBlockEnd'],
  insetInline: ['insetInlineStart', 'insetInlineEnd'],
};

/** Bare numeric strings (no CSS unit) that emit invalid CSS when serialized. */
export const BARE_NUMBER_STRING_RE = /^-?\d+(\.\d+)?$/;

export function findShorthandLonghandConflicts(
  propertyNames: readonly string[],
): Array<{ shorthand: string; longhand: string }> {
  const keys = new Set(propertyNames);
  const seen = new Set<string>();
  const conflicts: Array<{ shorthand: string; longhand: string }> = [];

  for (const key of keys) {
    const longhands = SHORTHAND_TO_LONGHANDS[key];
    if (longhands) {
      for (const longhand of longhands) {
        if (keys.has(longhand)) {
          const id = `${key}|${longhand}`;
          if (!seen.has(id)) {
            seen.add(id);
            conflicts.push({ shorthand: key, longhand });
          }
        }
      }
    }
  }

  return conflicts;
}
