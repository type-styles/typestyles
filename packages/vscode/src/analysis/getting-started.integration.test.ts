import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { nodeAtPosition, propertyAccessPath, createSourceFile } from './ast-utils';
import { buildCssPreview } from './css-preview';
import { buildDocumentIndex, findEnclosingStyleRegistration } from './document-index';

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../docs/src/demos/getting-started-button.impl.ts',
);

describe('getting-started-button.impl.ts integration', () => {
  const content = readFileSync(fixturePath, 'utf8');
  const filePath = fixturePath;

  it('indexes button registration and emits scoped class names', () => {
    const index = buildDocumentIndex(filePath, content);
    expect(index.registrations.map((r) => r.namespace)).toEqual(['button']);
    expect(index.tokenNamespaces[0]?.bindingName).toBe('color');

    const reg = index.registrations[0];
    expect(reg).toBeDefined();
    const preview = buildCssPreview(index, reg!);
    expect(preview?.classNames).toContain('app-button-base');
    expect(preview?.classNames).toContain('app-button-intent-primary');
    expect(preview?.css).toContain('background-color: #0066ff');
  });

  it('resolves color.primary token path from identifier hover position', () => {
    const index = buildDocumentIndex(filePath, content);
    const sourceFile = createSourceFile(filePath, content);
    const offset = content.indexOf('backgroundColor: color.primary');
    const primaryOffset = content.indexOf('primary', offset);

    const node = nodeAtPosition(sourceFile, primaryOffset);
    expect(ts.isIdentifier(node)).toBe(true);

    const access = ts.isPropertyAccessExpression(node.parent) ? node.parent : null;
    expect(access).not.toBeNull();
    expect(propertyAccessPath(access!)).toBe('color.primary');

    const leaf = index.tokenNamespaces[0]?.leaves.find((item) => {
      const ns = index.tokenNamespaces[0];
      const full = ns?.bindingName
        ? `${ns.bindingName}.${item.path.slice(1).join('.')}`
        : item.path.join('.');
      return full === 'color.primary';
    });
    expect(leaf?.value).toBe('#0066ff');
  });

  it('matches offsets inside the styles.component call', () => {
    const index = buildDocumentIndex(filePath, content);
    const paddingOffset = content.indexOf("padding: '8px");
    expect(findEnclosingStyleRegistration(index, paddingOffset)?.namespace).toBe('button');
  });
});
