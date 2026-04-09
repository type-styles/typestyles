import type { JSX } from 'react';
import { Link as AriaLink, type LinkProps as RACLinkProps } from 'react-aria-components';
import { link } from '@examples/design-system';
import { cx } from './utils';

export type LinkProps = Omit<RACLinkProps, 'className'> & {
  className?: string;
};

export function Link({ className, ...props }: LinkProps): JSX.Element {
  return <AriaLink {...props} className={cx(link, className)} />;
}
