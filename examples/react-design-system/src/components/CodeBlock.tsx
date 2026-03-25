import { useMemo, useState } from 'react';
import { codeBlock } from '@examples/design-system';
import { cx } from './utils';

type CodeBlockVariant = 'default' | 'inline' | 'diff' | 'terminal';
type FeedbackTone = 'success' | 'error' | null;

export type CodeBlockProps = {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
  copyable?: boolean;
  variant?: CodeBlockVariant;
  wrapLongLines?: boolean;
  showLineNumbers?: boolean;
  highlightedLines?: number[];
  copyLabel?: string;
  copiedLabel?: string;
  copyErrorLabel?: string;
};

const variantRootClass: Record<CodeBlockVariant, string> = {
  default: codeBlock('rootDefault'),
  inline: codeBlock('rootInline'),
  diff: codeBlock('rootDiff'),
  terminal: codeBlock('rootTerminal'),
};

export function CodeBlock({
  code,
  language,
  filename,
  className,
  copyable = true,
  variant = 'default',
  wrapLongLines = false,
  showLineNumbers = false,
  highlightedLines = [],
  copyLabel = 'Copy code',
  copiedLabel = 'Copied',
  copyErrorLabel = 'Copy failed',
}: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>(null);

  const highlightedSet = useMemo(() => new Set(highlightedLines), [highlightedLines]);
  const lines = useMemo(() => code.replace(/\n$/, '').split('\n'), [code]);
  const terminal = variant === 'terminal';
  const inline = variant === 'inline';

  const feedbackClassName = cx(
    codeBlock('feedback'),
    codeBlock('feedbackInline'),
    feedbackTone === 'success' && codeBlock('feedbackSuccess'),
    feedbackTone === 'error' && codeBlock('feedbackError'),
  );

  const resetCopyState = () => {
    setIsCopied(false);
    setHasError(false);
    setFeedbackText('');
    setFeedbackTone(null);
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setHasError(false);
      setFeedbackText(copiedLabel);
      setFeedbackTone('success');
    } catch {
      setIsCopied(false);
      setHasError(true);
      setFeedbackText(copyErrorLabel);
      setFeedbackTone('error');
    }

    setTimeout(resetCopyState, 1200);
  };

  if (inline) {
    return (
      <code
        className={cx(codeBlock('root'), variantRootClass[variant], codeBlock('code'), className)}
        data-codeblock
      >
        {code}
      </code>
    );
  }

  return (
    <div className={cx(codeBlock('root'), variantRootClass[variant], className)} data-codeblock>
      <div className={cx(codeBlock('header'), terminal && codeBlock('headerTerminal'))} data-codeblock-header>
        <div className={codeBlock('title')}>
          {filename ? <span className={codeBlock('filename')}>{filename}</span> : null}
          {language ? (
            <span className={cx(codeBlock('language'), terminal && codeBlock('languageTerminal'))}>
              {language}
            </span>
          ) : null}
        </div>
        {copyable ? (
          <div className={codeBlock('actions')}>
            <button
              type="button"
              className={cx(
                codeBlock('copyButton'),
                !isCopied && !hasError && codeBlock('copyButtonIdle'),
                isCopied && codeBlock('copyButtonCopied'),
                hasError && codeBlock('copyButtonError'),
              )}
              data-copied={isCopied || undefined}
              data-error={hasError || undefined}
              onClick={onCopy}
              aria-label={isCopied ? copiedLabel : copyLabel}
            >
              {isCopied ? 'Copied' : hasError ? 'Error' : 'Copy'}
            </button>
            <span className={feedbackClassName} role="status" aria-live="polite">
              {feedbackText}
            </span>
          </div>
        ) : null}
      </div>

      <div
        className={cx(
          codeBlock('body'),
          codeBlock('bodyScrollable'),
          terminal && codeBlock('bodyTerminal'),
        )}
        data-codeblock-body
      >
        <pre
          className={cx(
            codeBlock('pre'),
            wrapLongLines ? codeBlock('preWrap') : codeBlock('preScrollX'),
            terminal && codeBlock('preTerminal'),
          )}
          data-codeblock-pre
        >
          {showLineNumbers ? (
            <code className={cx(codeBlock('code'), codeBlock('lines'))}>
              {lines.map((line, index) => {
                const lineNumber = index + 1;
                return (
                  <span
                    key={lineNumber}
                    className={cx(
                      codeBlock('line'),
                      highlightedSet.has(lineNumber) && codeBlock('lineHighlighted'),
                    )}
                  >
                    <span className={codeBlock('lineNumber')} aria-hidden="true">
                      {lineNumber}
                    </span>
                    <span className={codeBlock('lineContent')}>{line || ' '}</span>
                  </span>
                );
              })}
            </code>
          ) : (
            <code className={codeBlock('code')}>{code}</code>
          )}
        </pre>
      </div>
    </div>
  );
}
