const STYLES_COMPONENT_RE = /styles\.component\(\s*['"]([^'"]+)['"]/g;
const STYLES_CLASS_RE = /styles\.class\(\s*['"]([^'"]+)['"]/g;
const TOKENS_CREATE_RE = /tokens\.create\(\s*['"]([^'"]+)['"]/g;
const CREATE_THEME_RE = /(?:tokens\.)?createTheme\(\s*['"]([^'"]+)['"]/g;
const KEYFRAMES_CREATE_RE = /keyframes\.create\(\s*['"]([^'"]+)['"]/g;
const GLOBAL_STYLE_RE = /global\.style\(\s*['"]([^'"]+)['"]/g;
const GLOBAL_FONT_FACE_RE = /global\.fontFace\(\s*['"]([^'"]+)['"]/g;

/** Canonical sugar / API names that register `styles.override` rules. */
const OVERRIDE_HMR_EXPORT_NAMES = new Set(['createDesignTheme', 'overrideComponent']);

export const TYPESTYLES_IMPORT_RE = /(?:from\s+|import\s+|require\s*\(\s*)['"]typestyles['"]/;

/**
 * Strip block + line comments so HMR detection ignores documented examples
 * (`// createDesignTheme({…})`) without treating them as live calls.
 */
function stripCommentsForHmrScan(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/**
 * Local binding names that may call override-registering APIs, including
 * `import { createDesignTheme as cdt }` renames and `import * as Core` namespaces.
 */
function collectOverrideHmrCallTargets(code: string): {
  locals: Set<string>;
  namespaces: Set<string>;
} {
  const locals = new Set<string>(OVERRIDE_HMR_EXPORT_NAMES);
  const namespaces = new Set<string>();

  for (const match of code.matchAll(/import\s*{([^}]+)}\s*from\s*['"][^'"]+['"]/g)) {
    for (const rawPart of match[1].split(',')) {
      const part = rawPart.trim();
      if (!part || part.startsWith('type ')) continue;
      const asMatch = part.match(/^(\w+)\s+as\s+(\w+)$/);
      if (asMatch) {
        if (OVERRIDE_HMR_EXPORT_NAMES.has(asMatch[1])) {
          locals.add(asMatch[2]);
        }
        continue;
      }
      const name = part.match(/^(\w+)$/)?.[1];
      if (name && OVERRIDE_HMR_EXPORT_NAMES.has(name)) {
        locals.add(name);
      }
    }
  }

  for (const match of code.matchAll(/import\s*\*\s*as\s+(\w+)\s*from\s*['"][^'"]+['"]/g)) {
    namespaces.add(match[1]);
  }

  return { locals, namespaces };
}

/**
 * True when this module may register `styles.override` rules and needs Vite HMR
 * dispose tracking — including Var UI sugar (`createDesignTheme` / `overrideComponent`)
 * that never spells `styles.override` in source.
 *
 * Detects renamed imports (`createDesignTheme as cdt`) and namespace imports
 * (`Core.createDesignTheme(`), not only the canonical identifier spelling.
 */
export function moduleNeedsOverrideHmr(code: string): boolean {
  const scan = stripCommentsForHmrScan(code);
  if (/\bstyles\.override\s*\(/.test(scan)) return true;

  const { locals, namespaces } = collectOverrideHmrCallTargets(scan);
  for (const name of locals) {
    if (new RegExp(`\\b${name}\\s*\\(`).test(scan)) return true;
  }
  for (const ns of namespaces) {
    if (new RegExp(`\\b${ns}\\.(?:createDesignTheme|overrideComponent)\\s*\\(`).test(scan)) {
      return true;
    }
  }
  return false;
}

/**
 * Extract namespace information from source code for invalidation and duplicate checks.
 */
export function extractNamespaces(code: string): {
  keys: string[];
  prefixes: string[];
} {
  const keys: string[] = [];
  const prefixes: string[] = [];

  for (const match of code.matchAll(STYLES_COMPONENT_RE)) {
    prefixes.push(`.${match[1]}-`);
  }
  for (const match of code.matchAll(STYLES_CLASS_RE)) {
    prefixes.push(`.${match[1]}-`);
  }
  for (const match of code.matchAll(TOKENS_CREATE_RE)) {
    keys.push(`tokens:${match[1]}`);
  }
  for (const match of code.matchAll(CREATE_THEME_RE)) {
    keys.push(`theme:${match[1]}`);
  }
  for (const match of code.matchAll(KEYFRAMES_CREATE_RE)) {
    keys.push(`keyframes:${match[1]}`);
  }
  for (const match of code.matchAll(GLOBAL_STYLE_RE)) {
    prefixes.push(match[1]);
  }
  for (const match of code.matchAll(GLOBAL_FONT_FACE_RE)) {
    prefixes.push(`font-face:${match[1]}`);
  }

  return { keys, prefixes };
}

export interface DuplicateNamespaceReporter {
  error(message: string): void;
}

/**
 * Fail the build when the same style namespace appears in more than one module.
 */
export function reportDuplicateNamespaces(
  moduleNamespaces: Map<string, { keys: string[]; prefixes: string[] }>,
  id: string,
  prefixes: string[],
  reporter: DuplicateNamespaceReporter,
): void {
  for (const [otherId, other] of moduleNamespaces) {
    if (otherId === id) continue;
    for (const prefix of prefixes) {
      if (other.prefixes.includes(prefix)) {
        const ns = prefix.slice(1, -1);
        reporter.error(
          `[typestyles] Style namespace "${ns}" is also used in ${otherId}. ` +
            `Duplicate namespaces cause class name collisions. ` +
            `Use a distinct name or isolate with createStyles({ scopeId: fileScopeId(import.meta) }).`,
        );
      }
    }
  }
}
