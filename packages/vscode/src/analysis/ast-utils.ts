import ts from 'typescript';
import type { ClassNamingConfig } from './class-naming';
import type { ThemeDefinition } from './theme-index';

export type NamespaceKind =
  | 'styles.class'
  | 'styles.component'
  | 'styles.hashClass'
  | 'tokens.create';

export interface SourceLocation {
  filePath: string;
  start: number;
  end: number;
}

export interface NamespaceCall {
  kind: NamespaceKind;
  namespace: string;
  node: ts.CallExpression;
  location: SourceLocation;
}

export interface StyleRegistration extends NamespaceCall {
  exportName?: string;
  styleObjects: ts.ObjectLiteralExpression[];
  isDynamicConfig: boolean;
}

export interface TokenLeaf {
  path: string[];
  value: string;
  location: SourceLocation;
  color?: string;
}

export interface TokenNamespace {
  namespace: string;
  bindingName?: string;
  leaves: TokenLeaf[];
  location: SourceLocation;
}

export interface ComponentBinding {
  name: string;
  namespace: string;
  location: SourceLocation;
  registration: StyleRegistration;
}

export interface DocumentIndex {
  filePath: string;
  naming: ClassNamingConfig;
  registrations: StyleRegistration[];
  tokenNamespaces: TokenNamespace[];
  themes: ThemeDefinition[];
  componentBindings: ComponentBinding[];
  classNameToRegistration: Map<string, StyleRegistration>;
}

function offsetLocation(filePath: string, node: ts.Node): SourceLocation {
  return {
    filePath,
    start: node.getStart(),
    end: node.getEnd(),
  };
}

function memberPropertyName(node: ts.PropertyAccessExpression): string | null {
  if (ts.isIdentifier(node.name)) return node.name.text;
  return null;
}

function isMemberCall(
  callee: ts.LeftHandSideExpression,
  objectName: string,
  method: string,
): boolean {
  if (!ts.isPropertyAccessExpression(callee)) return false;
  const methodName = memberPropertyName(callee);
  if (methodName !== method) return false;
  return ts.isIdentifier(callee.expression) && callee.expression.text === objectName;
}

function firstStringArg(args: ts.NodeArray<ts.Expression>): ts.StringLiteral | null {
  const first = args[0];
  if (!first || !ts.isStringLiteral(first)) return null;
  return first;
}

export function getNamespaceCall(node: ts.CallExpression, filePath: string): NamespaceCall | null {
  const { expression, arguments: args } = node;

  if (isMemberCall(expression, 'styles', 'class')) {
    const nameNode = firstStringArg(args);
    if (!nameNode) return null;
    return {
      kind: 'styles.class',
      namespace: nameNode.text,
      node,
      location: offsetLocation(filePath, node),
    };
  }

  if (isMemberCall(expression, 'styles', 'component')) {
    const nameNode = firstStringArg(args);
    if (!nameNode) return null;
    return {
      kind: 'styles.component',
      namespace: nameNode.text,
      node,
      location: offsetLocation(filePath, node),
    };
  }

  if (isMemberCall(expression, 'styles', 'hashClass')) {
    const first = args[0];
    if (first && ts.isStringLiteral(first)) {
      return {
        kind: 'styles.hashClass',
        namespace: first.text,
        node,
        location: offsetLocation(filePath, node),
      };
    }
    const label = args[1];
    if (label && ts.isStringLiteral(label)) {
      return {
        kind: 'styles.hashClass',
        namespace: label.text,
        node,
        location: offsetLocation(filePath, node),
      };
    }
    return null;
  }

  if (isMemberCall(expression, 'tokens', 'create')) {
    const nameNode = firstStringArg(args);
    if (!nameNode) return null;
    return {
      kind: 'tokens.create',
      namespace: nameNode.text,
      node,
      location: offsetLocation(filePath, node),
    };
  }

  if (ts.isPropertyAccessExpression(expression)) {
    const method = memberPropertyName(expression);
    if (
      (method === 'class' || method === 'component') &&
      ts.isIdentifier(expression.expression) &&
      /style/i.test(expression.expression.text)
    ) {
      const nameNode = firstStringArg(args);
      if (!nameNode) return null;
      return {
        kind: method === 'class' ? 'styles.class' : 'styles.component',
        namespace: nameNode.text,
        node,
        location: offsetLocation(filePath, node),
      };
    }
    if (method === 'create' && ts.isIdentifier(expression.expression)) {
      const root = expression.expression.text;
      if (root.endsWith('tokens') || root === 'tokens') {
        const nameNode = firstStringArg(args);
        if (!nameNode) return null;
        return {
          kind: 'tokens.create',
          namespace: nameNode.text,
          node,
          location: offsetLocation(filePath, node),
        };
      }
    }
  }

  return null;
}

export function getObjectPropertyExpression(
  prop: ts.ObjectLiteralElementLike,
): { key: string; expression: ts.Expression } | null {
  if (ts.isPropertyAssignment(prop)) {
    const key = getStaticPropertyKey(prop);
    if (!key) return null;
    return { key, expression: prop.initializer };
  }
  if (ts.isShorthandPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
    return { key: prop.name.text, expression: prop.name };
  }
  return null;
}

export function getStaticPropertyKey(prop: ts.ObjectLiteralElementLike): string | null {
  if (ts.isPropertyAssignment(prop)) {
    if (ts.isIdentifier(prop.name)) return prop.name.text;
    if (ts.isStringLiteral(prop.name)) return prop.name.text;
  }
  if (ts.isShorthandPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
    return prop.name.text;
  }
  return null;
}

const NESTED_SELECTOR_KEY_RE = /^(&|@|\[)/;
const COMPONENT_STRUCTURAL_KEYS = new Set([
  'base',
  'variants',
  'defaultVariants',
  'compoundVariants',
  'slots',
]);

export function isCssPropertyKey(key: string): boolean {
  if (NESTED_SELECTOR_KEY_RE.test(key)) return false;
  if (COMPONENT_STRUCTURAL_KEYS.has(key)) return false;
  return /^[a-zA-Z]/.test(key);
}

export function visitStyleObjectLiterals(
  node: ts.ObjectLiteralExpression,
  onStyleObject: (obj: ts.ObjectLiteralExpression) => void,
): void {
  onStyleObject(node);

  for (const prop of node.properties) {
    const key = getStaticPropertyKey(prop);
    if (!key || !ts.isPropertyAssignment(prop)) continue;

    if (NESTED_SELECTOR_KEY_RE.test(key)) {
      if (ts.isObjectLiteralExpression(prop.initializer)) {
        visitStyleObjectLiterals(prop.initializer, onStyleObject);
      }
      continue;
    }

    if (key === 'variants' && ts.isObjectLiteralExpression(prop.initializer)) {
      for (const groupProp of prop.initializer.properties) {
        if (
          !ts.isPropertyAssignment(groupProp) ||
          !ts.isObjectLiteralExpression(groupProp.initializer)
        ) {
          continue;
        }
        for (const optionProp of groupProp.initializer.properties) {
          if (
            ts.isPropertyAssignment(optionProp) &&
            ts.isObjectLiteralExpression(optionProp.initializer)
          ) {
            visitStyleObjectLiterals(optionProp.initializer, onStyleObject);
          }
        }
      }
      continue;
    }

    if (key === 'compoundVariants' && ts.isArrayLiteralExpression(prop.initializer)) {
      for (const element of prop.initializer.elements) {
        if (!ts.isObjectLiteralExpression(element)) continue;
        for (const cvProp of element.properties) {
          if (!ts.isPropertyAssignment(cvProp)) continue;
          const cvKey = getStaticPropertyKey(cvProp);
          if (cvKey === 'css' && ts.isObjectLiteralExpression(cvProp.initializer)) {
            visitStyleObjectLiterals(cvProp.initializer, onStyleObject);
          }
        }
      }
      continue;
    }

    if (
      (COMPONENT_STRUCTURAL_KEYS.has(key) || ts.isObjectLiteralExpression(prop.initializer)) &&
      ts.isObjectLiteralExpression(prop.initializer)
    ) {
      visitStyleObjectLiterals(prop.initializer, onStyleObject);
    }
  }
}

export function getStyleObjectArguments(node: ts.CallExpression): {
  objects: ts.ObjectLiteralExpression[];
  isDynamicConfig: boolean;
} {
  const { expression, arguments: args } = node;
  const objects: ts.ObjectLiteralExpression[] = [];

  const pushObject = (arg: ts.Expression | undefined) => {
    if (!arg) return;
    if (ts.isObjectLiteralExpression(arg)) objects.push(arg);
    if (ts.isArrowFunction(arg) && ts.isObjectLiteralExpression(arg.body)) {
      objects.push(arg.body);
    }
    if (ts.isArrowFunction(arg) && !ts.isObjectLiteralExpression(arg.body)) {
      return;
    }
  };

  if (ts.isPropertyAccessExpression(expression)) {
    const method = memberPropertyName(expression);
    if (method === 'class' || method === 'component') {
      const configArg = args[1];
      if (
        configArg &&
        ts.isArrowFunction(configArg) &&
        !ts.isObjectLiteralExpression(configArg.body)
      ) {
        return { objects, isDynamicConfig: true };
      }
      pushObject(args[1]);
      return { objects, isDynamicConfig: false };
    }
    if (method === 'hashClass') {
      if (args[0] && ts.isStringLiteral(args[0])) {
        pushObject(args[1]);
      } else {
        pushObject(args[0]);
      }
      return { objects, isDynamicConfig: false };
    }
  }

  return { objects, isDynamicConfig: false };
}

export function evaluateStaticValue(
  node: ts.Expression,
  tokenValues: Map<string, string>,
): unknown | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

  if (ts.isTemplateExpression(node)) {
    let result = node.head.text;
    for (const span of node.templateSpans) {
      const part = evaluateStaticValue(span.expression, tokenValues);
      if (part === undefined) return undefined;
      result += String(part) + span.literal.text;
    }
    return result;
  }

  if (ts.isObjectLiteralExpression(node)) {
    const record: Record<string, unknown> = {};
    for (const prop of node.properties) {
      const key = getStaticPropertyKey(prop);
      if (!key || !ts.isPropertyAssignment(prop)) continue;
      const value = evaluateStaticValue(prop.initializer, tokenValues);
      if (value === undefined) return undefined;
      record[key] = value;
    }
    return record;
  }

  if (ts.isArrayLiteralExpression(node)) {
    const values: unknown[] = [];
    for (const element of node.elements) {
      if (!element || ts.isOmittedExpression(element)) return undefined;
      const value = evaluateStaticValue(element, tokenValues);
      if (value === undefined) return undefined;
      values.push(value);
    }
    return values;
  }

  if (ts.isPropertyAccessExpression(node)) {
    const path = propertyAccessPath(node);
    if (path) {
      const resolved = tokenValues.get(path);
      if (resolved !== undefined) return resolved;
    }
  }

  if (ts.isIdentifier(node)) {
    const resolved = tokenValues.get(node.text);
    if (resolved !== undefined) return resolved;
  }

  return undefined;
}

export function propertyAccessPath(node: ts.PropertyAccessExpression): string | null {
  const parts: string[] = [];
  let current: ts.Expression = node;

  while (ts.isPropertyAccessExpression(current)) {
    parts.unshift(current.name.text);
    current = current.expression;
  }

  if (ts.isIdentifier(current)) {
    parts.unshift(current.text);
    return parts.join('.');
  }

  return null;
}

export function nodeAtPosition(sourceFile: ts.SourceFile, position: number): ts.Node {
  return findDeepestNode(sourceFile, position) ?? sourceFile;
}

function findDeepestNode(node: ts.Node, position: number): ts.Node | undefined {
  if (position < node.getStart() || position > node.getEnd()) return undefined;

  let deepest: ts.Node = node;
  const visit = (child: ts.Node) => {
    if (position >= child.getStart() && position <= child.getEnd()) {
      const deeper = findDeepestNode(child, position);
      if (deeper) deepest = deeper;
    }
  };

  ts.forEachChild(node, visit);
  return deepest;
}

export function findCallExpressionAncestor(node: ts.Node): ts.CallExpression | null {
  let current: ts.Node | undefined = node;
  while (current) {
    if (ts.isCallExpression(current)) return current;
    current = current.parent;
  }
  return null;
}

export function createSourceFile(filePath: string, content: string): ts.SourceFile {
  const kind = filePath.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : filePath.endsWith('.jsx')
      ? ts.ScriptKind.JSX
      : filePath.endsWith('.ts')
        ? ts.ScriptKind.TS
        : ts.ScriptKind.JS;

  return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, kind);
}
