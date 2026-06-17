import type * as vscode from 'vscode';
import { registerDefinitionProvider } from './providers/definition';
import { registerHoverProvider } from './providers/hover';

export function activate(context: vscode.ExtensionContext): void {
  registerHoverProvider(context);
  registerDefinitionProvider(context);
}

export function deactivate(): void {}
