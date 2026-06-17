import type { CSSProperties } from './types';
import { formatDeclaration, resolveNestedSelector, serializeStyle, type CSSRule } from './css';
import {
  buildComponentClassName,
  buildSingleClassName,
  hashString,
  stableSerialize,
  type ClassNamingConfig,
} from './class-naming';

export type AtomicDecomposition = {
  /** Space-separated atomic class names for the style object. */
  classNames: string;
  rules: CSSRule[];
};

function isNestedPropertyKey(key: string): boolean {
  return key.includes('&') || key.startsWith('[');
}

function atomicClassName(cfg: ClassNamingConfig, declKey: string, value: unknown): string {
  const payload = stableSerialize({
    ...(cfg.scopeId ? { scope: cfg.scopeId } : {}),
    decl: declKey,
    value,
  });
  return `${cfg.prefix}-${hashString(payload)}`;
}

function resolveSelectorChain(baseSelector: string, nestedKeys: readonly string[]): string {
  let selector = baseSelector;
  for (const key of nestedKeys) {
    const next = resolveNestedSelector(selector, key);
    if (next) selector = next;
  }
  return selector;
}

function walkAtomic(
  cfg: ClassNamingConfig,
  properties: CSSProperties,
  pathPrefix: string,
  nestedSelectorKeys: readonly string[],
  classNames: string[],
  rules: CSSRule[],
): void {
  for (const [prop, value] of Object.entries(properties)) {
    if (value == null) continue;

    if (isNestedPropertyKey(prop)) {
      const nextPath = pathPrefix ? `${pathPrefix}|${prop}` : prop;
      walkAtomic(
        cfg,
        value as CSSProperties,
        nextPath,
        [...nestedSelectorKeys, prop],
        classNames,
        rules,
      );
      continue;
    }

    if (prop.startsWith('@')) {
      const atPath = pathPrefix ? `${pathPrefix}|${prop}` : prop;
      const innerClassNames: string[] = [];
      const innerRules: CSSRule[] = [];
      walkAtomic(
        cfg,
        value as CSSProperties,
        atPath,
        nestedSelectorKeys,
        innerClassNames,
        innerRules,
      );
      for (const inner of innerRules) {
        rules.push({
          key: `${prop}:${inner.key}`,
          css: `${prop} { ${inner.css} }`,
        });
      }
      classNames.push(...innerClassNames);
      continue;
    }

    const declKey = pathPrefix ? `${pathPrefix}|${prop}` : prop;
    const className = atomicClassName(cfg, declKey, value);
    classNames.push(className);
    const selector = resolveSelectorChain(`.${className}`, nestedSelectorKeys);
    const declaration = formatDeclaration(prop, value as string | number);
    rules.push({
      key: selector,
      css: `${selector} { ${declaration}; }`,
    });
  }
}

/**
 * Split a style object into one class + one rule per declaration. Identical
 * declarations share a class name (deduped at insert time by selector key).
 */
export function decomposeAtomicStyle(
  cfg: ClassNamingConfig,
  properties: CSSProperties,
): AtomicDecomposition {
  const classNames: string[] = [];
  const rules: CSSRule[] = [];
  walkAtomic(cfg, properties, '', [], classNames, rules);
  return {
    classNames: classNames.join(' '),
    rules,
  };
}

export function classNamesAndRulesForProperties(
  classNaming: ClassNamingConfig,
  properties: CSSProperties,
  namespace: string,
  suffix: string,
  kind: 'class' | 'component',
): AtomicDecomposition {
  if (classNaming.mode === 'atomic') {
    return decomposeAtomicStyle(classNaming, properties);
  }

  const className =
    kind === 'class'
      ? buildSingleClassName(classNaming, namespace, properties)
      : buildComponentClassName(classNaming, namespace, suffix, properties);

  return {
    classNames: className,
    rules: serializeStyle(`.${className}`, properties),
  };
}
