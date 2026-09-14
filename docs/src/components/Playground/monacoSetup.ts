import editorWorker from 'monaco-editor/editor/editor.worker?worker';
import cssWorker from 'monaco-editor/language/css/css.worker?worker';
import tsWorker from 'monaco-editor/language/typescript/ts.worker?worker';
// Side-effect: register monarch tokenizers (Vite tree-shakes these from the main entry).
import 'monaco-editor/languages/definitions/css/register';
import 'monaco-editor/languages/definitions/typescript/register';
import { editor, KeyCode, KeyMod, Uri, typescript } from 'monaco-editor';
// Structural CSS is linked from PlaygroundLayout (`/playground/monaco-editor.css`),
// copied at build time — monaco-editor's package exports block direct CSS imports.

type TypesManifest = Record<string, string>;

let typesLoaded = false;
let compilerConfigured = false;
let environmentConfigured = false;
let transitionHooksInstalled = false;

const sharedEditorOptions: editor.IStandaloneEditorConstructionOptions = {
  theme: 'vs-dark',
  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
  fontSize: 13,
  lineNumbers: 'on',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  padding: { top: 12, bottom: 12 },
};

function configureMonacoEnvironment(): void {
  if (environmentConfigured) return;

  // Monaco 0.56 loads workers via `new URL('...?esm', import.meta.url)`, which Vite
  // does not bundle. Supply workers explicitly with Vite's `?worker` imports.
  self.MonacoEnvironment = {
    getWorker(_workerId: string, label: string): Worker {
      if (label === 'typescript' || label === 'javascript') {
        return new tsWorker();
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return new cssWorker();
      }
      return new editorWorker();
    },
  };

  environmentConfigured = true;
}

function configureTypeScript(): void {
  if (compilerConfigured) return;

  typescript.typescriptDefaults.setCompilerOptions({
    target: typescript.ScriptTarget.ESNext,
    module: typescript.ModuleKind.ESNext,
    moduleResolution: typescript.ModuleResolutionKind.NodeJs,
    jsx: typescript.JsxEmit.ReactJSX,
    jsxImportSource: '@typestyles/react',
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    allowNonTsExtensions: true,
    allowJs: true,
  });

  typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });

  compilerConfigured = true;
}

async function loadExtraLibs(): Promise<void> {
  if (typesLoaded) return;

  try {
    const response = await fetch('/playground/types.json');
    if (!response.ok) {
      console.warn('[playground] Failed to load types.json:', response.status);
      return;
    }
    const manifest = (await response.json()) as TypesManifest;
    for (const [path, content] of Object.entries(manifest)) {
      typescript.typescriptDefaults.addExtraLib(content, path);
    }
    typesLoaded = true;
  } catch (error) {
    console.warn('[playground] Failed to load Monaco type libs:', error);
  }
}

/**
 * ClientRouter rebuilds <head> on soft navigations and drops Monaco's runtime
 * `style.monaco-colors` tag. Mirror it into the incoming document so the theme
 * service singleton keeps writing into a connected stylesheet.
 */
export function installMonacoTransitionHooks(): void {
  if (transitionHooksInstalled || typeof document === 'undefined') return;
  transitionHooksInstalled = true;

  document.addEventListener('astro:before-swap', (event) => {
    const colors = document.head.querySelector('style.monaco-colors');
    if (!colors) return;
    if (event.newDocument.head.querySelector('style.monaco-colors')) return;
    // Move (don't clone) so Monaco's theme service keeps updating the same node
    // after ClientRouter rebuilds <head>.
    event.newDocument.head.appendChild(colors);
  });
}

export const monaco = { editor, KeyCode, KeyMod };

export async function createPlaygroundEditor(
  container: HTMLElement,
  initialValue: string,
): Promise<editor.IStandaloneCodeEditor> {
  installMonacoTransitionHooks();
  configureMonacoEnvironment();
  configureTypeScript();
  await loadExtraLibs();

  const uri = Uri.parse('file:///playground/App.tsx');
  const existing = editor.getModel(uri);
  if (existing) existing.dispose();

  const model = editor.createModel(initialValue, 'typescript', uri);
  editor.setModelLanguage(model, 'typescript');

  const instance = editor.create(container, {
    ...sharedEditorOptions,
    model,
  });

  // Re-apply theme so token colors refresh after View Transition head swaps.
  editor.setTheme('vs-dark');
  return instance;
}

/** Read-only CSS output pane — reuses the already-loaded Monaco bundle. */
export function createCssOutputEditor(
  container: HTMLElement,
  initialValue = '/* CSS appears after a successful run */',
): editor.IStandaloneCodeEditor {
  configureMonacoEnvironment();

  const uri = Uri.parse('file:///playground/output.css');
  const existing = editor.getModel(uri);
  if (existing) existing.dispose();

  const model = editor.createModel(initialValue, 'css', uri);
  // Ensure the language id sticks even if URI-based detection races the tokenizer load.
  editor.setModelLanguage(model, 'css');

  return editor.create(container, {
    ...sharedEditorOptions,
    model,
    readOnly: true,
    domReadOnly: true,
    renderLineHighlight: 'none',
    contextmenu: false,
    quickSuggestions: false,
  });
}
