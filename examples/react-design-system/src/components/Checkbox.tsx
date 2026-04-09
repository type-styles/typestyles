import type { JSX, ReactNode } from 'react';
import {
  Checkbox as AriaCheckbox,
  type CheckboxProps as RACCheckboxProps,
} from 'react-aria-components';
import { checkbox } from '@examples/design-system';

export type CheckboxProps = Omit<RACCheckboxProps, 'children'> & {
  children?: ReactNode;
};

export function Checkbox({ children, ...props }: CheckboxProps): JSX.Element {
  return (
    <AriaCheckbox {...props} className={checkbox.root}>
      {({ isSelected }) => (
        <>
          <span className={checkbox.box} data-selected={isSelected || undefined}>
            {isSelected ? '✓' : ''}
          </span>
          <span className={checkbox.label}>{children}</span>
        </>
      )}
    </AriaCheckbox>
  );
}
