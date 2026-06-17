import * as vscode from 'vscode';
import {
  findCallExpressionAncestor,
  getNamespaceCall,
  nodeAtPosition,
  propertyAccessPath,
  createSourceFile,
} from '../analysis/ast-utils';
import {
  buildCssPreview,
  findStylePropertyKeyHover,
  formatCssPreviewMarkdown,
} from '../analysis/css-preview';
import { formatCssPropertyDocMarkdown } from '../analysis/css-property-docs';
import {
  buildDocumentIndex,
  findEnclosingStyleRegistration,
  findPropertyAccessAt,
  findTokenLeafAtPosition,
  findTokenLeafByPath,
} from '../analysis/document-index';
import { formatTokenLeafMarkdown } from '../analysis/token-preview';

export function registerHoverProvider(context: vscode.ExtensionContext): void {
  const selector: vscode.DocumentSelector = [
    { language: 'typescript', scheme: 'file' },
    { language: 'typescriptreact', scheme: 'file' },
    { language: 'javascript', scheme: 'file' },
    { language: 'javascriptreact', scheme: 'file' },
  ];

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, {
      provideHover(document, position) {
        try {
          return provideTypestylesHover(document, position);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error('[typestyles-vscode] hover failed:', message);
          return null;
        }
      },
    }),
  );
}

function provideTypestylesHover(
  document: vscode.TextDocument,
  position: vscode.Position,
): vscode.Hover | null {
  const config = vscode.workspace.getConfiguration('typestyles');
  const showPropertyDocs = config.get<boolean>('showCssPropertyDocs', true);
  const content = document.getText();
  const filePath = document.uri.fsPath;
  const previewMode = config.get<'semantic' | 'hashed' | 'compact'>('previewMode', 'semantic');
  const index = buildDocumentIndex(filePath, content, { previewMode });
  const offset = document.offsetAt(position);
  const sourceFile = createSourceFile(filePath, content);
  const node = nodeAtPosition(sourceFile, offset);

  const tokenLeaf = findTokenLeafAtPosition(index, offset);
  if (tokenLeaf) {
    return markdownHover(formatTokenLeafMarkdown(tokenLeaf));
  }

  const propertyAccess = findPropertyAccessAt(node);
  if (propertyAccess) {
    const path = propertyAccessPath(propertyAccess);
    if (path) {
      const referenced = findTokenLeafByPath(index, path);
      if (referenced) return markdownHover(formatTokenLeafMarkdown(referenced));
    }
  }

  if (showPropertyDocs) {
    const propertyHover = findStylePropertyKeyHover(sourceFile, index, offset);
    if (propertyHover) {
      const doc = formatCssPropertyDocMarkdown(propertyHover.property);
      if (doc) return markdownHover(doc);
    }
  }

  const enclosingRegistration = findEnclosingStyleRegistration(index, offset);
  if (enclosingRegistration) {
    const preview = buildCssPreview(index, enclosingRegistration);
    if (preview) return markdownHover(formatCssPreviewMarkdown(preview));
  }

  const call = findCallExpressionAncestor(node);
  if (call) {
    const namespaceCall = getNamespaceCall(call, filePath);
    if (
      namespaceCall &&
      (namespaceCall.kind === 'styles.class' ||
        namespaceCall.kind === 'styles.component' ||
        namespaceCall.kind === 'styles.hashClass')
    ) {
      const reg = index.registrations.find((r) => r.node === call);
      if (reg) {
        const preview = buildCssPreview(index, reg);
        if (preview) return markdownHover(formatCssPreviewMarkdown(preview));
      }
    }
  }

  return null;
}

function markdownHover(value: string): vscode.Hover {
  const markdown = new vscode.MarkdownString(value);
  markdown.isTrusted = true;
  markdown.supportHtml = true;
  return new vscode.Hover(markdown);
}
