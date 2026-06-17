import ts from 'typescript';
import {
  buildComponentClassName,
  buildSingleClassName,
  defaultClassNamingConfig,
  type ClassNamingConfig,
} from './class-naming';
import type { ClassNamingMode } from './class-naming';
import {
  createSourceFile,
  evaluateStaticValue,
  getNamespaceCall,
  getStaticPropertyKey,
  getStyleObjectArguments,
  type ComponentBinding,
  type DocumentIndex,
  type StyleRegistration,
  type TokenLeaf,
  type TokenNamespace,
} from './ast-utils';
import type { StyleRecord } from './css-serialize';

function inferNamingConfig(
  sourceFile: ts.SourceFile,
  fallbackMode?: ClassNamingMode,
): ClassNamingConfig {
  let scopeId = '';
  let mode: ClassNamingMode = fallbackMode ?? defaultClassNamingConfig.mode;

  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const isFactory =
        (ts.isIdentifier(callee) &&
          (callee.text === 'createTypeStyles' || callee.text === 'createStyles')) ||
        (ts.isPropertyAccessExpression(callee) &&
          ts.isIdentifier(callee.name) &&
          (callee.name.text === 'createTypeStyles' || callee.name.text === 'createStyles'));

      if (isFactory && node.arguments[0] && ts.isObjectLiteralExpression(node.arguments[0])) {
        for (const prop of node.arguments[0].properties) {
          const key = getStaticPropertyKey(prop);
          if (!key || !ts.isPropertyAssignment(prop)) continue;
          if (key === 'scopeId' && ts.isStringLiteral(prop.initializer)) {
            scopeId = prop.initializer.text;
          }
          if (key === 'mode' && ts.isStringLiteral(prop.initializer)) {
            const value = prop.initializer.text;
            if (value === 'semantic' || value === 'hashed' || value === 'compact') {
              mode = value;
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return { ...defaultClassNamingConfig, scopeId, mode };
}

function collectTokenNamespaces(
  sourceFile: ts.SourceFile,
  filePath: string,
  tokenValues: Map<string, string>,
): TokenNamespace[] {
  const namespaces: TokenNamespace[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const call = getNamespaceCall(node, filePath);
      if (call?.kind === 'tokens.create' && node.arguments[1]) {
        const config = node.arguments[1];
        if (!ts.isObjectLiteralExpression(config)) {
          ts.forEachChild(node, visit);
          return;
        }

        let bindingName: string | undefined;
        if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
          bindingName = node.parent.name.text;
        }

        const leaves: TokenLeaf[] = [];
        collectTokenLeaves(config, [call.namespace], leaves, filePath, tokenValues, bindingName);

        namespaces.push({
          namespace: call.namespace,
          bindingName,
          leaves,
          location: call.location,
        });
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return namespaces;
}

function collectTokenLeaves(
  node: ts.ObjectLiteralExpression,
  path: string[],
  leaves: TokenLeaf[],
  filePath: string,
  tokenValues: Map<string, string>,
  bindingName?: string,
): void {
  for (const prop of node.properties) {
    const key = getStaticPropertyKey(prop);
    if (!key || !ts.isPropertyAssignment(prop)) continue;

    const nextPath = [...path, key];
    const fullPath = bindingName
      ? `${bindingName}.${nextPath.slice(1).join('.')}`
      : nextPath.join('.');

    if (ts.isObjectLiteralExpression(prop.initializer)) {
      collectTokenLeaves(prop.initializer, nextPath, leaves, filePath, tokenValues, bindingName);
      continue;
    }

    const value = evaluateStaticValue(prop.initializer, tokenValues);
    if (typeof value !== 'string') continue;

    tokenValues.set(fullPath, value);
    tokenValues.set(nextPath.join('.'), value);

    leaves.push({
      path: nextPath,
      value,
      location: {
        filePath,
        start: prop.initializer.getStart(),
        end: prop.initializer.getEnd(),
      },
      color: parseColor(value) ?? undefined,
    });
  }
}

function collectStyleRegistrations(
  sourceFile: ts.SourceFile,
  filePath: string,
): StyleRegistration[] {
  const registrations: StyleRegistration[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const call = getNamespaceCall(node, filePath);
      if (
        call &&
        (call.kind === 'styles.class' ||
          call.kind === 'styles.component' ||
          call.kind === 'styles.hashClass')
      ) {
        const { objects, isDynamicConfig } = getStyleObjectArguments(node);
        let exportName: string | undefined;
        if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
          exportName = node.parent.name.text;
        }

        registrations.push({
          ...call,
          exportName,
          styleObjects: objects,
          isDynamicConfig,
        });
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return registrations;
}

function collectComponentBindings(registrations: StyleRegistration[]): ComponentBinding[] {
  return registrations
    .filter((reg) => reg.kind === 'styles.component' && reg.exportName)
    .map((reg) => ({
      name: reg.exportName as string,
      namespace: reg.namespace,
      location: reg.location,
      registration: reg,
    }));
}

function indexClassNames(
  registrations: StyleRegistration[],
  naming: ClassNamingConfig,
  tokenValues: Map<string, string>,
): Map<string, StyleRegistration> {
  const map = new Map<string, StyleRegistration>();

  for (const reg of registrations) {
    if (reg.isDynamicConfig) continue;

    if (reg.kind === 'styles.class' || reg.kind === 'styles.hashClass') {
      for (const obj of reg.styleObjects) {
        const props = evaluateStaticValue(obj, tokenValues);
        if (!props || typeof props !== 'object' || Array.isArray(props)) continue;
        const className = buildSingleClassName(naming, reg.namespace, props as StyleRecord);
        map.set(className, reg);
      }
      continue;
    }

    for (const obj of reg.styleObjects) {
      const config = evaluateStaticValue(obj, tokenValues);
      if (!config || typeof config !== 'object' || Array.isArray(config)) continue;
      const record = config as Record<string, unknown>;

      if (record.base && typeof record.base === 'object' && !Array.isArray(record.base)) {
        const className = buildComponentClassName(
          naming,
          reg.namespace,
          'base',
          record.base as StyleRecord,
        );
        map.set(className, reg);
      }

      const variants = record.variants;
      if (variants && typeof variants === 'object' && !Array.isArray(variants)) {
        for (const [group, options] of Object.entries(variants as Record<string, unknown>)) {
          if (!options || typeof options !== 'object' || Array.isArray(options)) continue;
          for (const [option, css] of Object.entries(options as Record<string, unknown>)) {
            if (!css || typeof css !== 'object' || Array.isArray(css)) continue;
            const suffix = `${group}-${option}`;
            const className = buildComponentClassName(
              naming,
              reg.namespace,
              suffix,
              css as StyleRecord,
            );
            map.set(className, reg);
          }
        }
      }
    }
  }

  return map;
}

export function buildDocumentIndex(
  filePath: string,
  content: string,
  options?: { previewMode?: ClassNamingMode },
): DocumentIndex {
  const sourceFile = createSourceFile(filePath, content);
  const naming = inferNamingConfig(sourceFile, options?.previewMode);
  const tokenValues = new Map<string, string>();
  const tokenNamespaces = collectTokenNamespaces(sourceFile, filePath, tokenValues);
  const registrations = collectStyleRegistrations(sourceFile, filePath);
  const componentBindings = collectComponentBindings(registrations);
  const classNameToRegistration = indexClassNames(registrations, naming, tokenValues);

  return {
    filePath,
    naming,
    registrations,
    tokenNamespaces,
    componentBindings,
    classNameToRegistration,
  };
}

export function parseColor(value: string): string | null {
  const trimmed = value.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed)) return trimmed;
  if (/^rgba?\(/i.test(trimmed)) return trimmed;
  if (/^hsla?\(/i.test(trimmed)) return trimmed;
  return null;
}

export function findTokenLeafAtPosition(index: DocumentIndex, position: number): TokenLeaf | null {
  for (const ns of index.tokenNamespaces) {
    for (const leaf of ns.leaves) {
      if (position >= leaf.location.start && position <= leaf.location.end) {
        return leaf;
      }
    }
  }
  return null;
}

export function findStyleRegistrationAtPosition(
  index: DocumentIndex,
  position: number,
): StyleRegistration | null {
  for (const reg of index.registrations) {
    if (position >= reg.location.start && position <= reg.location.end) {
      return reg;
    }
  }
  return null;
}

export function findComponentBindingAtCall(
  index: DocumentIndex,
  callName: string,
): ComponentBinding | null {
  return index.componentBindings.find((binding) => binding.name === callName) ?? null;
}

export function findRegistrationByClassName(
  index: DocumentIndex,
  className: string,
): StyleRegistration | null {
  return index.classNameToRegistration.get(className) ?? null;
}

export function findCssPropertyKeyAtPosition(
  sourceFile: ts.SourceFile,
  position: number,
): string | null {
  const node = sourceFile;
  let found: string | null = null;

  const visit = (child: ts.Node) => {
    if (position < child.getStart() || position > child.getEnd()) return;
    if (ts.isPropertyAssignment(child)) {
      const key = getStaticPropertyKey(child);
      if (key && position >= child.name.getStart() && position <= child.name.getEnd()) {
        found = key;
      }
    }
    ts.forEachChild(child, visit);
  };

  visit(node);
  return found;
}
