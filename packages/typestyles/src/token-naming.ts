import { sanitizeClassSegment } from './class-naming';

export type TokenNameContext = {
  /** Raw `scopeId` from `createTokens`, trimmed; undefined when unscoped. */
  scopeId: string | undefined;
  /** Sanitized scope segment used in default naming (`app` from `@acme/ui`). */
  scope: string;
  /** First argument to `tokens.create('color', …)`. */
  namespace: string;
  /** Flattened leaf path with default `-` join (`brand-primary`). */
  path: string;
  /** Path segments before joining (`['brand', 'primary']`). */
  segments: readonly string[];
};

export type TokenNameTemplate = (ctx: TokenNameContext) => string;

export function defaultTokenNameTemplate(ctx: TokenNameContext): string {
  const ns = ctx.scopeId ? `${ctx.scope}-${ctx.namespace}` : ctx.namespace;
  return `--${ns}-${ctx.path}`;
}

export function buildTokenNameContext(
  scopeId: string | undefined,
  namespace: string,
  path: string,
  segments: readonly string[],
): TokenNameContext {
  const trimmedScope = scopeId?.trim() || undefined;
  return {
    scopeId: trimmedScope,
    scope: trimmedScope ? sanitizeClassSegment(trimmedScope) : '',
    namespace,
    path,
    segments,
  };
}

const VALID_TOKEN_NAME = /^--[a-zA-Z0-9_-]+$/;

function normalizeTokenPropertyName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const withPrefix = trimmed.startsWith('--') ? trimmed : `--${trimmed}`;
  const body = withPrefix.slice(2);
  const safeBody = body
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return safeBody ? `--${safeBody}` : '';
}

function assertValidTokenName(name: string, namespace: string, path: string): void {
  if (!VALID_TOKEN_NAME.test(name)) {
    throw new Error(
      `[typestyles] tokens.create('${namespace}'): nameTemplate produced invalid custom property name ` +
        `"${name}" for path "${path}". Names must match /^--[a-z0-9-]+$/ after sanitization.`,
    );
  }
}

export function resolveTokenName(
  template: TokenNameTemplate | undefined,
  ctx: TokenNameContext,
  namespaceForError = ctx.namespace,
): string {
  const raw = (template ?? defaultTokenNameTemplate)(ctx);
  const name = normalizeTokenPropertyName(raw);

  if (process.env.NODE_ENV !== 'production') {
    assertValidTokenName(name, namespaceForError, ctx.path);
  } else if (!VALID_TOKEN_NAME.test(name)) {
    throw new Error(
      `[typestyles] tokens.create('${namespaceForError}'): invalid custom property name for path "${ctx.path}".`,
    );
  }

  return name;
}

export type ThemeTokenNaming = {
  resolveName(namespace: string, path: string, segments: readonly string[]): string;
};

export function createThemeTokenNaming(
  scopeId: string | undefined,
  instanceDefaultTemplate: TokenNameTemplate | undefined,
  namespaceTemplates: ReadonlyMap<string, TokenNameTemplate | undefined>,
  nameByPathByNamespace: ReadonlyMap<string, ReadonlyMap<string, string>>,
): ThemeTokenNaming {
  return {
    resolveName(namespace, path, segments) {
      const registered = nameByPathByNamespace.get(namespace)?.get(path);
      if (registered) return registered;

      const template = namespaceTemplates.get(namespace) ?? instanceDefaultTemplate;
      const ctx = buildTokenNameContext(scopeId, namespace, path, segments);
      return resolveTokenName(template, ctx, namespace);
    },
  };
}
