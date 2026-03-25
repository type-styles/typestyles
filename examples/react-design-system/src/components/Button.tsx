import type { ComponentProps } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { dsButton } from '@examples/design-system';
import { cx } from './utils';

export type ButtonProps = Omit<ComponentProps<typeof AriaButton>, 'className'> & {
  className?: string;
  intent?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ intent = 'secondary', className, ...props }: ButtonProps) {
  return <AriaButton {...props} className={cx(dsButton.base, dsButton[intent], className)} />;
}
