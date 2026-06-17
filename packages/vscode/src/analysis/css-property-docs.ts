/** Short hover docs for common CSS properties (stretch goal in P3.5.4). */

const CSS_PROPERTY_DOCS: Readonly<Record<string, string>> = {
  display: 'Sets the outer display type and inner formatting context.',
  position: 'Sets how an element is positioned in the document.',
  top: 'Offsets a positioned element from the top edge of its containing block.',
  right: 'Offsets a positioned element from the right edge of its containing block.',
  bottom: 'Offsets a positioned element from the bottom edge of its containing block.',
  left: 'Offsets a positioned element from the left edge of its containing block.',
  width: 'Sets the width of an element.',
  height: 'Sets the height of an element.',
  minWidth: 'Sets the minimum width of an element.',
  maxWidth: 'Sets the maximum width of an element.',
  minHeight: 'Sets the minimum height of an element.',
  maxHeight: 'Sets the maximum height of an element.',
  margin: 'Shorthand for outer spacing on all four sides.',
  padding: 'Shorthand for inner spacing on all four sides.',
  border: 'Shorthand for border width, style, and color.',
  borderRadius: 'Rounds the corners of an element’s outer border edge.',
  backgroundColor: 'Sets the background color of an element.',
  color: 'Sets the foreground text color.',
  fontSize: 'Sets the size of the font.',
  fontWeight: 'Sets the weight (thickness) of the font glyphs.',
  fontFamily: 'Specifies a prioritized list of font family names.',
  lineHeight: 'Sets the height of a line box.',
  textAlign: 'Describes how inline content is aligned within a block.',
  textDecoration: 'Decorations applied to text (underline, line-through, etc.).',
  cursor: 'Sets the mouse cursor when hovering the element.',
  opacity: 'Sets the transparency level of the element.',
  overflow: 'Controls how content overflowing the box is handled.',
  zIndex: 'Sets the stack order of a positioned element.',
  flex: 'Shorthand for flex-grow, flex-shrink, and flex-basis.',
  flexDirection: 'Sets how flex items are placed in the flex container.',
  alignItems: 'Aligns flex items along the cross axis.',
  justifyContent: 'Aligns flex items along the main axis.',
  gap: 'Sets the gaps between rows and columns in flex and grid layouts.',
  gridTemplateColumns: 'Defines the column track list for a grid container.',
  gridTemplateRows: 'Defines the row track list for a grid container.',
  transition: 'Shorthand for transition-property, duration, timing, and delay.',
  transform: 'Applies 2D or 3D transforms to an element.',
  boxShadow: 'Attaches one or more drop shadows to the box.',
  outline: 'Shorthand for outline width, style, and color.',
  visibility: 'Shows or hides an element without affecting layout.',
  pointerEvents: 'Sets under what circumstances the element becomes a target for pointer events.',
  appearance: 'Controls native styling of UI widgets.',
};

export function getCssPropertyDoc(property: string): string | null {
  return CSS_PROPERTY_DOCS[property] ?? null;
}

export function formatCssPropertyDocMarkdown(property: string): string | null {
  const doc = getCssPropertyDoc(property);
  if (!doc) return null;
  return `**CSS \`${property}\`**\n\n${doc}`;
}
