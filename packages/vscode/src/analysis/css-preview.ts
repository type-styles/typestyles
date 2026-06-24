import {
  buildComponentClassName,
  buildSingleClassName,
  emittedComponentClassPrefix,
} from './class-naming';
import {
  evaluateStaticValue,
  getStaticPropertyKey,
  visitStyleObjectLiterals,
  type StyleRegistration,
} from './ast-utils';
import type { DocumentIndex } from './ast-utils';
import { serializeStyle, type StyleRecord } from './css-serialize';
import ts from 'typescript';

export interface CssPreview {
  title: string;
  classNames: string[];
  css: string;
  note?: string;
}

export function buildCssPreview(
  index: DocumentIndex,
  registration: StyleRegistration,
): CssPreview | null {
  if (registration.isDynamicConfig) {
    return {
      title: `${registration.kind}('${registration.namespace}')`,
      classNames: [],
      css: '',
      note: 'Preview unavailable for dynamic component configs (callback form). Run extraction to inspect emitted CSS.',
    };
  }

  const tokenValues = buildTokenValueMap(index);
  const naming = index.naming;
  const rules: string[] = [];
  const classNames: string[] = [];

  if (registration.kind === 'styles.class' || registration.kind === 'styles.hashClass') {
    for (const obj of registration.styleObjects) {
      const props = evaluateStaticValue(obj, tokenValues);
      if (!props || typeof props !== 'object' || Array.isArray(props)) {
        return {
          title: `${registration.kind}('${registration.namespace}')`,
          classNames: [],
          css: '',
          note: 'Preview unavailable — style object contains non-static values.',
        };
      }
      const className = buildSingleClassName(naming, registration.namespace, props as StyleRecord);
      classNames.push(className);
      for (const rule of serializeStyle(`.${className}`, props as StyleRecord)) {
        rules.push(rule.css);
      }
    }
  } else {
    for (const obj of registration.styleObjects) {
      const config = evaluateStaticValue(obj, tokenValues);
      if (!config || typeof config !== 'object' || Array.isArray(config)) {
        return {
          title: `styles.component('${registration.namespace}')`,
          classNames: [],
          css: '',
          note: 'Preview unavailable — component config contains non-static values.',
        };
      }

      const record = config as Record<string, unknown>;
      if (record.base && typeof record.base === 'object' && !Array.isArray(record.base)) {
        const className = buildComponentClassName(
          naming,
          registration.namespace,
          'base',
          record.base as StyleRecord,
        );
        classNames.push(className);
        for (const rule of serializeStyle(`.${className}`, record.base as StyleRecord)) {
          rules.push(rule.css);
        }
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
              registration.namespace,
              suffix,
              css as StyleRecord,
            );
            classNames.push(className);
            for (const rule of serializeStyle(`.${className}`, css as StyleRecord)) {
              rules.push(rule.css);
            }
          }
        }
      }
    }
  }

  const prefix = emittedComponentClassPrefix(naming, registration.namespace);
  const title =
    registration.kind === 'styles.component'
      ? `styles.component('${registration.namespace}')`
      : `${registration.kind}('${registration.namespace}')`;

  return {
    title,
    classNames,
    css: rules.join('\n'),
    note:
      prefix && registration.kind === 'styles.component'
        ? `Variant prefix: \`${prefix}*\` (${naming.mode} mode)`
        : undefined,
  };
}

export function formatCssPreviewMarkdown(preview: CssPreview): string {
  const parts: string[] = [`**TypeStyles** — ${preview.title}`];

  if (preview.note) {
    parts.push('', `_${preview.note}_`);
  }

  if (preview.classNames.length > 0) {
    parts.push('', `**Classes:** ${preview.classNames.map((c) => `\`${c}\``).join(', ')}`);
  }

  if (preview.css) {
    parts.push('', '```css', preview.css, '```');
  }

  return parts.join('\n');
}

function buildTokenValueMap(index: DocumentIndex): Map<string, string> {
  const map = new Map<string, string>();
  for (const ns of index.tokenNamespaces) {
    for (const leaf of ns.leaves) {
      const path = leaf.path.join('.');
      map.set(path, leaf.value);
      if (ns.bindingName) {
        map.set(`${ns.bindingName}.${leaf.path.slice(1).join('.')}`, leaf.value);
      }
    }
  }
  return map;
}

export function findStylePropertyKeyHover(
  sourceFile: ts.SourceFile,
  index: DocumentIndex,
  position: number,
): { property: string; registration: StyleRegistration } | null {
  let result: { property: string; registration: StyleRegistration } | null = null;

  const visit = (node: ts.Node) => {
    if (position < node.getStart() || position > node.getEnd()) return;

    if (ts.isPropertyAssignment(node)) {
      const key = getStaticPropertyKey(node);
      if (
        key &&
        position >= node.name.getStart() &&
        position <= node.name.getEnd() &&
        ts.isObjectLiteralExpression(node.parent)
      ) {
        const registration = findRegistrationForStyleObject(index, node.parent);
        if (registration) {
          result = { property: key, registration };
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return result;
}

function findRegistrationForStyleObject(
  index: DocumentIndex,
  styleObject: ts.ObjectLiteralExpression,
): StyleRegistration | null {
  for (const reg of index.registrations) {
    for (const obj of reg.styleObjects) {
      if (obj === styleObject) return reg;
      let contains = false;
      visitStyleObjectLiterals(obj, (nested) => {
        if (nested === styleObject) contains = true;
      });
      if (contains) return reg;
    }
  }

  let current: ts.Node | undefined = styleObject;
  while (current) {
    if (ts.isCallExpression(current)) {
      for (const reg of index.registrations) {
        if (reg.node === current) return reg;
      }
    }
    current = current.parent;
  }

  return null;
}
