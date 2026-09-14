import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync as flushReact } from 'react-dom';
import { flushSync as flushTypestyles, getRegisteredCss } from 'typestyles';
import { resetAll } from 'typestyles/testing';

type RunMessage = {
  type: 'playground-run';
  runId: number;
  code: string;
};

type ResultMessage = {
  type: 'playground-result';
  runId: number;
  css: string;
  error: string | null;
};

type ErrorBoundaryState = {
  error: Error | null;
};

class PreviewErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[playground]', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      throw this.state.error;
    }
    return this.props.children;
  }
}

let root: Root | null = null;
let userModuleUrl: string | null = null;

function postResult(message: ResultMessage): void {
  window.parent.postMessage(message, '*');
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  return String(error);
}

function isRunMessage(data: unknown): data is RunMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as RunMessage).type === 'playground-run' &&
    typeof (data as RunMessage).runId === 'number' &&
    typeof (data as RunMessage).code === 'string'
  );
}

async function runUserCode(runId: number, code: string): Promise<void> {
  resetAll();

  if (root) {
    root.unmount();
    root = null;
  }

  if (userModuleUrl) {
    URL.revokeObjectURL(userModuleUrl);
    userModuleUrl = null;
  }

  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Missing #root element in playground iframe.');
  }
  container.innerHTML = '';

  userModuleUrl = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
  const mod = (await import(/* @vite-ignore */ userModuleUrl)) as {
    default?: React.ComponentType;
  };
  const App = mod.default;

  if (!App) {
    throw new Error('App.tsx must default-export a React component.');
  }

  const nextRoot = createRoot(container);
  root = nextRoot;

  flushReact(() => {
    nextRoot.render(
      React.createElement(
        React.StrictMode,
        null,
        React.createElement(PreviewErrorBoundary, null, React.createElement(App)),
      ),
    );
  });

  flushTypestyles();
  const css = getRegisteredCss();
  postResult({ type: 'playground-result', runId, css, error: null });
}

window.addEventListener('message', (event) => {
  const data = event.data;
  if (!isRunMessage(data)) return;

  void runUserCode(data.runId, data.code).catch((error) => {
    postResult({
      type: 'playground-result',
      runId: data.runId,
      css: '',
      error: formatError(error),
    });
  });
});
