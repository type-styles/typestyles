import type { ComponentProps, JSX } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { button } from '@examples/design-system';
import { cx } from './utils';

export type ButtonProps = Omit<ComponentProps<typeof AriaButton>, 'className'> & {
  className?: string;
  intent?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ intent = 'secondary', className, ...props }: ButtonProps): JSX.Element {
  return <AriaButton {...props} className={cx(button.base, button[intent], className)} />;
}
