import * as vscode from 'vscode';
import {
  createSourceFile,
  findCallExpressionAncestor,
  nodeAtPosition,
} from '../analysis/ast-utils';
import {
  buildDocumentIndex,
  findComponentBindingAtCall,
  findRegistrationByClassName,
} from '../analysis/document-index';
import ts from 'typescript';

export function registerDefinitionProvider(context: vscode.ExtensionContext): void {
  const selector: vscode.DocumentSelector = [
    { language: 'typescript', scheme: 'file' },
    { language: 'typescriptreact', scheme: 'file' },
    { language: 'javascript', scheme: 'file' },
    { language: 'javascriptreact', scheme: 'file' },
  ];

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, {
      provideDefinition(document, position) {
        try {
          return provideTypestylesDefinition(document, position);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error('[typestyles-vscode] definition failed:', message);
          return null;
        }
      },
    }),
  );
}

function provideTypestylesDefinition(
  document: vscode.TextDocument,
  position: vscode.Position,
): vscode.Location | null {
  const content = document.getText();
  const filePath = document.uri.fsPath;
  const index = buildDocumentIndex(filePath, content);
  const offset = document.offsetAt(position);
  const sourceFile = createSourceFile(filePath, content);
  const node = nodeAtPosition(sourceFile, offset);

  if (ts.isIdentifier(node)) {
    const binding = findComponentBindingAtCall(index, node.text);
    if (binding) {
      return locationToDefinition(document, binding.location.start);
    }
  }

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    const className = node.text.trim();
    const registration = findRegistrationByClassName(index, className);
    if (registration) {
      return locationToDefinition(document, registration.location.start);
    }
  }

  const call = findCallExpressionAncestor(node);
  if (call && ts.isIdentifier(call.expression)) {
    const binding = findComponentBindingAtCall(index, call.expression.text);
    if (binding) {
      return locationToDefinition(document, binding.location.start);
    }
  }

  return null;
}

function locationToDefinition(document: vscode.TextDocument, offset: number): vscode.Location {
  const position = document.positionAt(offset);
  return new vscode.Location(document.uri, position);
}
