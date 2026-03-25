import type { ComponentProps } from 'react';
import { Link as AriaLink } from 'react-aria-components';
import { link } from '@examples/design-system';
import { cx } from './utils';

export type LinkProps = Omit<ComponentProps<typeof AriaLink>, 'className'> & {
  className?: string;
};

export function Link({ className, ...props }: LinkProps) {
  return <AriaLink {...props} className={cx(link, className)} />;
}
