const STYLES_COMPONENT_RE = /styles\.component\(\s*['"]([^'"]+)['"]/g;
const STYLES_CLASS_RE = /styles\.class\(\s*['"]([^'"]+)['"]/g;
const TOKENS_CREATE_RE = /tokens\.create\(\s*['"]([^'"]+)['"]/g;
const CREATE_THEME_RE = /(?:tokens\.)?createTheme\(\s*['"]([^'"]+)['"]/g;
const KEYFRAMES_CREATE_RE = /keyframes\.create\(\s*['"]([^'"]+)['"]/g;
const GLOBAL_STYLE_RE = /global\.style\(\s*['"]([^'"]+)['"]/g;
const GLOBAL_FONT_FACE_RE = /global\.fontFace\(\s*['"]([^'"]+)['"]/g;

/** APIs that register `styles.override` rules (directly or via design-system sugar). */
const OVERRIDE_HMR_API_RE =
  /\bstyles\.override\s*\(|\bcreateDesignTheme\s*\(|\boverrideComponent\s*\(/;

export const TYPESTYLES_IMPORT_RE = /(?:from\s+|import\s+|require\s*\(\s*)['"]typestyles['"]/;

/**
 * True when this module may register `styles.override` rules and needs Vite HMR
 * dispose tracking — including Var UI sugar (`createDesignTheme` / `overrideComponent`)
 * that never spells `styles.override` in source.
 */
export function moduleNeedsOverrideHmr(code: string): boolean {
  return OVERRIDE_HMR_API_RE.test(code);
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
