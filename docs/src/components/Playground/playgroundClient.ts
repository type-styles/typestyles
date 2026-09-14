import type { editor } from 'monaco-editor';
import {
  bindOutputTabs,
  setConsolePanel,
  setCssPanel,
  setErrorsPanel,
  type OutputTab,
} from './outputPanels';
import { buildShareUrl, readPlaygroundUrlState, writePlaygroundUrlState } from './urlState';

const DEBOUNCE_MS = 300;
const URL_SYNC_MS = 600;

type PlaygroundPreset = {
  id: string;
  label: string;
  source: string;
};

type PlaygroundBootstrap = {
  presets: PlaygroundPreset[];
  defaultPresetId: string;
  defaultSource: string;
};

type PlaygroundState = {
  editor: editor.IStandaloneCodeEditor;
  cssEditor: editor.IStandaloneCodeEditor;
  iframe: HTMLIFrameElement;
  runId: number;
  dirty: boolean;
  activePresetId: string;
  debounceTimer: ReturnType<typeof setTimeout> | null;
  urlSyncTimer: ReturnType<typeof setTimeout> | null;
  syncingFromUrl: boolean;
  activateTab: (tab: OutputTab) => void;
  abort: AbortController;
};

const playgroundState = new WeakMap<HTMLElement, PlaygroundState>();
const playgroundBinding = new WeakSet<HTMLElement>();
let lifecycleHooksInstalled = false;

function readBootstrap(root: HTMLElement): PlaygroundBootstrap | null {
  const jsonEl = root.querySelector('[data-playground-bootstrap]');
  if (!jsonEl?.textContent?.trim()) return null;
  try {
    return JSON.parse(jsonEl.textContent) as PlaygroundBootstrap;
  } catch {
    return null;
  }
}

function getPresetSelect(root: HTMLElement): HTMLSelectElement | null {
  return root.querySelector('[data-playground-preset]');
}

function getShareButton(root: HTMLElement): HTMLButtonElement | null {
  return root.querySelector('[data-playground-share]');
}

function resolveInitialSource(bootstrap: PlaygroundBootstrap): {
  source: string;
  presetId: string;
  dirty: boolean;
} {
  const urlState = readPlaygroundUrlState();

  if (urlState.code) {
    return {
      source: urlState.code,
      presetId: bootstrap.defaultPresetId,
      dirty: true,
    };
  }

  if (urlState.preset) {
    const preset = bootstrap.presets.find((item) => item.id === urlState.preset);
    if (preset) {
      return {
        source: preset.source,
        presetId: preset.id,
        dirty: false,
      };
    }
  }

  return {
    source: bootstrap.defaultSource,
    presetId: bootstrap.defaultPresetId,
    dirty: false,
  };
}

function scheduleUrlSync(root: HTMLElement): void {
  const state = playgroundState.get(root);
  if (!state || state.syncingFromUrl) return;

  if (state.urlSyncTimer) clearTimeout(state.urlSyncTimer);
  state.urlSyncTimer = setTimeout(() => {
    state.urlSyncTimer = null;
    if (state.dirty) {
      writePlaygroundUrlState({ code: state.editor.getValue() });
    } else {
      writePlaygroundUrlState({ preset: state.activePresetId });
    }
  }, URL_SYNC_MS);
}

async function runPlayground(root: HTMLElement, source: string): Promise<void> {
  const state = playgroundState.get(root);
  if (!state) return;

  const runId = ++state.runId;
  setConsolePanel(root, 'Running…');

  const { formatTranspileError, transpilePlaygroundSource } = await import('./transpile');

  let code: string;
  try {
    code = await transpilePlaygroundSource(source);
  } catch (error) {
    if (runId !== state.runId) return;
    const message = formatTranspileError(error);
    setErrorsPanel(root, message);
    setConsolePanel(root, message);
    state.activateTab('errors');
    return;
  }

  if (runId !== state.runId) return;

  state.iframe.contentWindow?.postMessage(
    {
      type: 'playground-run',
      runId,
      code,
    },
    '*',
  );
}

function scheduleRun(root: HTMLElement): void {
  const state = playgroundState.get(root);
  if (!state) return;

  if (state.debounceTimer) clearTimeout(state.debounceTimer);
  state.debounceTimer = setTimeout(() => {
    state.debounceTimer = null;
    void runPlayground(root, state.editor.getValue());
  }, DEBOUNCE_MS);
}

function runImmediately(root: HTMLElement): void {
  const state = playgroundState.get(root);
  if (!state) return;
  if (state.debounceTimer) {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = null;
  }
  void runPlayground(root, state.editor.getValue());
}

function applyPreset(root: HTMLElement, presetId: string, source: string): void {
  const state = playgroundState.get(root);
  if (!state) return;

  state.activePresetId = presetId;
  state.dirty = false;
  state.syncingFromUrl = true;
  state.editor.setValue(source);
  state.syncingFromUrl = false;
  writePlaygroundUrlState({ preset: presetId });
  runImmediately(root);
}

function getPresetSourceFromBootstrap(bootstrap: PlaygroundBootstrap, presetId: string): string {
  return (
    bootstrap.presets.find((preset) => preset.id === presetId)?.source ?? bootstrap.defaultSource
  );
}

function onPresetChange(root: HTMLElement, presetId: string): void {
  const state = playgroundState.get(root);
  const bootstrap = readBootstrap(root);
  if (!state || !bootstrap || presetId === state.activePresetId) return;

  if (state.dirty) {
    const confirmed = window.confirm('Replace your edits with this preset?');
    if (!confirmed) {
      const select = getPresetSelect(root);
      if (select) select.value = state.activePresetId;
      return;
    }
  }

  applyPreset(root, presetId, getPresetSourceFromBootstrap(bootstrap, presetId));
}

async function onShare(root: HTMLElement): Promise<void> {
  const state = playgroundState.get(root);
  const button = getShareButton(root);
  if (!state) return;

  const url = state.dirty
    ? buildShareUrl({ code: state.editor.getValue() })
    : buildShareUrl({ preset: state.activePresetId });

  writePlaygroundUrlState(
    state.dirty ? { code: state.editor.getValue() } : { preset: state.activePresetId },
  );

  try {
    await navigator.clipboard.writeText(url);
    if (button) {
      const previous = button.textContent;
      button.textContent = 'Copied!';
      window.setTimeout(() => {
        if (button.textContent === 'Copied!') button.textContent = previous;
      }, 1500);
    }
  } catch {
    window.prompt('Copy this playground URL:', url);
  }
}

function onPlaygroundMessage(root: HTMLElement, event: MessageEvent): void {
  const state = playgroundState.get(root);
  if (!state || event.source !== state.iframe.contentWindow) return;

  const data = event.data as {
    type?: string;
    runId?: number;
    css?: string;
    error?: string | null;
  };

  if (data.type !== 'playground-result' || typeof data.runId !== 'number') return;
  if (data.runId !== state.runId) return;

  if (data.error) {
    setErrorsPanel(root, data.error);
    setConsolePanel(root, data.error);
    state.activateTab('errors');
    return;
  }

  setCssPanel(state.cssEditor, data.css ?? '');
  setErrorsPanel(root, null);
  setConsolePanel(root, 'Ready');
}

function setEditorLoading(host: HTMLElement, loading: boolean): void {
  host.dataset.loading = loading ? 'true' : 'false';
  if (loading && !host.querySelector('[data-playground-loading]')) {
    const el = document.createElement('p');
    el.dataset.playgroundLoading = '';
    el.textContent = 'Loading editor…';
    el.style.cssText =
      'margin:0;padding:1.5rem;font:13px/1.4 JetBrains Mono,ui-monospace,monospace;opacity:0.7';
    host.appendChild(el);
  }
  if (!loading) {
    host.querySelector('[data-playground-loading]')?.remove();
  }
}

function disposePlayground(root: HTMLElement): void {
  const state = playgroundState.get(root);
  playgroundBinding.delete(root);
  if (!state) return;

  if (state.debounceTimer) clearTimeout(state.debounceTimer);
  if (state.urlSyncTimer) clearTimeout(state.urlSyncTimer);
  state.abort.abort();

  const editorModel = state.editor.getModel();
  const cssModel = state.cssEditor.getModel();
  state.editor.dispose();
  state.cssEditor.dispose();
  editorModel?.dispose();
  cssModel?.dispose();

  playgroundState.delete(root);
}

function disposeAllPlaygrounds(): void {
  for (const root of document.querySelectorAll<HTMLElement>('[data-playground]')) {
    disposePlayground(root);
  }
}

function installPlaygroundLifecycleHooks(): void {
  if (lifecycleHooksInstalled) return;
  lifecycleHooksInstalled = true;

  // Tear down Monaco before ClientRouter swaps the DOM so workers/models don't
  // linger against detached nodes (breaks highlighting + IntelliSense on return).
  document.addEventListener('astro:before-swap', () => {
    disposeAllPlaygrounds();
  });
}

export async function bindPlayground(root: HTMLElement): Promise<void> {
  installPlaygroundLifecycleHooks();

  const bootstrap = readBootstrap(root);
  if (!bootstrap) return;

  const editorHost = root.querySelector<HTMLElement>('[data-playground-editor]');
  const cssHost = root.querySelector<HTMLElement>('[data-playground-css]');
  const iframe = root.querySelector<HTMLIFrameElement>('[data-playground-frame]');
  const presetSelect = getPresetSelect(root);
  const shareButton = getShareButton(root);

  if (!editorHost || !cssHost || !iframe) return;

  const existing = playgroundState.get(root);
  if (existing) {
    existing.editor.layout();
    existing.cssEditor.layout();
    return;
  }

  // Prevent concurrent double-bind (eager boot + astro:page-load, or rapid transitions).
  if (playgroundBinding.has(root)) return;
  playgroundBinding.add(root);

  setEditorLoading(editorHost, true);

  try {
    const [
      { createPlaygroundEditor, createCssOutputEditor, monaco, installMonacoTransitionHooks },
    ] = await Promise.all([
      import('./monacoSetup'),
      import('./transpile').then((mod) => mod.ensureEsbuild()),
    ]);

    installMonacoTransitionHooks();

    const initial = resolveInitialSource(bootstrap);
    const editorInstance = await createPlaygroundEditor(editorHost, initial.source);
    const cssEditor = createCssOutputEditor(cssHost);
    setEditorLoading(editorHost, false);

    const abort = new AbortController();
    const { signal } = abort;

    const tabs = bindOutputTabs(root, (tab) => {
      if (tab === 'css') {
        // Monaco needs a layout pass after the panel becomes visible.
        requestAnimationFrame(() => cssEditor.layout());
      }
    });
    tabs.activate('result');

    const state: PlaygroundState = {
      editor: editorInstance,
      cssEditor,
      iframe,
      runId: 0,
      dirty: initial.dirty,
      activePresetId: initial.presetId,
      debounceTimer: null,
      urlSyncTimer: null,
      syncingFromUrl: false,
      activateTab: tabs.activate,
      abort,
    };
    playgroundState.set(root, state);

    if (presetSelect) {
      presetSelect.value = initial.presetId;
      presetSelect.addEventListener(
        'change',
        () => {
          onPresetChange(root, presetSelect.value);
        },
        { signal },
      );
    }

    if (shareButton) {
      shareButton.addEventListener(
        'click',
        () => {
          void onShare(root);
        },
        { signal },
      );
    }

    editorInstance.onDidChangeModelContent(() => {
      if (state.syncingFromUrl) return;
      state.dirty = true;
      scheduleRun(root);
      scheduleUrlSync(root);
    });

    editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runImmediately(root);
    });

    window.addEventListener('message', (event) => onPlaygroundMessage(root, event), { signal });

    const start = () => runImmediately(root);
    if (iframe.contentDocument?.readyState === 'complete') {
      start();
    } else {
      iframe.addEventListener('load', start, { once: true, signal });
    }
  } catch (error) {
    playgroundBinding.delete(root);
    setEditorLoading(editorHost, false);
    setErrorsPanel(root, error instanceof Error ? error.message : String(error));
    setConsolePanel(root, 'Failed to load playground');
    throw error;
  }
}

export function initPlaygrounds(): void {
  installPlaygroundLifecycleHooks();
  for (const root of document.querySelectorAll<HTMLElement>('[data-playground]')) {
    void bindPlayground(root);
  }
}
