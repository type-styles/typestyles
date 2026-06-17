/**
 * Keep CSS rules relevant to a live demo variant (matching class selectors and token/theme rules).
 */
export function filterCssForDemo(
  css: string,
  classNames: string,
  options?: { tokenPrefix?: string; includeThemeRules?: boolean },
): string {
  const classes = classNames.split(/\s+/).filter(Boolean);
  const tokenPrefix = options?.tokenPrefix ?? '--';
  const blocks: string[] = [];

  for (const block of splitCssBlocks(css)) {
    const matchesClass = classes.some((cls) => block.includes(`.${cls}`));
    const matchesToken =
      block.includes(':root') && (tokenPrefix === '--' || block.includes(tokenPrefix));
    const matchesTheme = options?.includeThemeRules && block.includes('.theme-');
    if (matchesClass || matchesToken || matchesTheme) {
      blocks.push(block.trim());
    }
  }

  return blocks.join('\n\n');
}

function splitCssBlocks(css: string): string[] {
  const blocks: string[] = [];
  let current = '';
  let depth = 0;

  for (const line of css.split('\n')) {
    current += (current ? '\n' : '') + line;
    depth += (line.match(/\{/g) ?? []).length;
    depth -= (line.match(/\}/g) ?? []).length;
    if (depth <= 0 && current.trim()) {
      blocks.push(current);
      current = '';
      depth = 0;
    }
  }

  if (current.trim()) blocks.push(current);
  return blocks;
}
