/**
 * Pretty-print compact CSS rule blocks for the live demo "Emitted CSS" panel.
 */
export function formatDemoCss(css: string): string {
  const trimmed = css.trim();
  if (!trimmed) return trimmed;

  return trimmed
    .split(/\n\s*\n/)
    .map((block) => formatCssBlock(block.trim()))
    .filter(Boolean)
    .join('\n\n');
}

function formatCssBlock(block: string): string {
  if (!block) return block;

  const open = block.indexOf('{');
  const close = block.lastIndexOf('}');
  if (open === -1 || close === -1 || close < open) {
    return block;
  }

  const selector = block.slice(0, open).trim();
  const body = block.slice(open + 1, close).trim();
  if (!body) {
    return `${selector} {\n}`;
  }

  const declarations = splitDeclarations(body)
    .map((decl) => `  ${decl};`)
    .join('\n');

  return `${selector} {\n${declarations}\n}`;
}

/** Split on `;` but keep semicolons inside parentheses (e.g. color-mix). */
function splitDeclarations(body: string): string[] {
  const out: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of body) {
    if (char === '(') depth += 1;
    if (char === ')') depth = Math.max(0, depth - 1);

    if (char === ';' && depth === 0) {
      const decl = current.trim();
      if (decl) out.push(decl);
      current = '';
      continue;
    }

    current += char;
  }

  const tail = current.trim();
  if (tail) out.push(tail);
  return out;
}
