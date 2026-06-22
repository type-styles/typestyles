import { setAdapterIfNotSet } from '@vanilla-extract/css/adapter';
import { setFileScope, endFileScope } from '@vanilla-extract/css/fileScope';

export type VeCssEntry = {
  type: 'local' | 'global';
  selector: string;
  rule: Record<string, unknown>;
};

let collectedCss: VeCssEntry[] = [];
let adapterSet = false;

function ensureAdapter() {
  if (adapterSet) return;
  setAdapterIfNotSet({
    appendCss: (css: VeCssEntry) => {
      collectedCss.push(css);
    },
    registerClassName: () => {},
    registerComposition: () => {},
    onEndFileScope: () => {},
    getIdentOption: () => 'debug',
  });
  adapterSet = true;
}

export function resetVe() {
  collectedCss = [];
}

export function beginFileScope(filename: string) {
  ensureAdapter();
  setFileScope(filename, 'benchmarks');
}

export function endScope() {
  endFileScope();
}

export function getCollectedCss(): VeCssEntry[] {
  return collectedCss;
}

function serializeRule(rule: Record<string, unknown>, indent: string): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(rule)) {
    if (key === 'vars' && typeof value === 'object' && value !== null) {
      for (const [varName, varValue] of Object.entries(value as Record<string, string>)) {
        const cleanName = varName.startsWith('var(') ? varName.slice(4, -1) : varName;
        lines.push(`${indent}${cleanName}: ${varValue};`);
      }
    } else if (key.startsWith('@') && typeof value === 'object' && value !== null) {
      lines.push(`${indent}${key} {`);
      lines.push(serializeRule(value as Record<string, unknown>, indent + '  '));
      lines.push(`${indent}}`);
    } else if (typeof value === 'object' && value !== null) {
      // Nested selector (e.g. selectors key or media queries within rule)
      lines.push(`${indent}${key} {`);
      lines.push(serializeRule(value as Record<string, unknown>, indent + '  '));
      lines.push(`${indent}}`);
    } else {
      const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      lines.push(`${indent}${cssKey}: ${value};`);
    }
  }
  return lines.join('\n');
}

export function serializeCollectedCss(): string {
  const rules: string[] = [];
  for (const entry of collectedCss) {
    const sel = entry.type === 'local' ? `.${entry.selector}` : entry.selector;
    const body = serializeRule(entry.rule, '  ');
    rules.push(`${sel} {\n${body}\n}`);
  }
  return rules.join('\n');
}
