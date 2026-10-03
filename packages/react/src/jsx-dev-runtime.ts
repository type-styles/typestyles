import { useContext, type ElementType, type ReactNode } from 'react';
import { jsxDEV as reactJsxDEV, Fragment as ReactFragment } from 'react/jsx-dev-runtime';
import type { CSSProperties } from 'typestyles';
import { resolveCssPropClass } from './css-prop';
import { TypeStylesContext } from './context';
import type { WithCssProp } from './types';

function processCssProp<P extends Record<string, unknown>>(
  props: WithCssProp<P>,
  hashClass: (properties: CSSProperties, label?: string) => string,
): P {
  if (props.css == null) {
    return props as P;
  }

  const { css, className, ...rest } = props;
  const nextProps = {
    ...rest,
    className: resolveCssPropClass(hashClass, css, className),
  } as unknown as P;

  return nextProps;
}

export const Fragment = ReactFragment;

export function jsxDEV<P extends Record<string, unknown>>(
  type: ElementType,
  props: WithCssProp<P>,
  key: React.Key | undefined,
  isStaticChildren: boolean,
  source: object | undefined,
  self: unknown,
): React.ReactElement {
  const styles = useContext(TypeStylesContext);

  if (props.css != null && styles == null) {
    throw new Error(
      '[@typestyles/react] The `css` prop requires a `TypeStylesProvider` with a `styles` instance. ' +
        'Wrap your app in `<TypeStylesProvider styles={styles}>`, or use the Babel plugin for zero-runtime css props.',
    );
  }

  const nextProps = styles ? processCssProp(props, styles.hashClass) : (props as P);
  return reactJsxDEV(type, nextProps, key, isStaticChildren, source, self);
}

export type { ReactNode };
