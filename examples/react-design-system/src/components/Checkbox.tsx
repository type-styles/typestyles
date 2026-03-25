import type { ComponentProps, ReactNode } from 'react';
import { Checkbox as AriaCheckbox } from 'react-aria-components';
import { dsCheckbox } from '@examples/design-system';

export type CheckboxProps = Omit<ComponentProps<typeof AriaCheckbox>, 'children'> & {
  children?: ReactNode;
};

export function Checkbox({ children, ...props }: CheckboxProps) {
  return (
    <AriaCheckbox {...props} className={dsCheckbox('root')}>
      {({ isSelected }) => (
        <>
          <span className={dsCheckbox('box')} data-selected={isSelected || undefined}>
            {isSelected ? '✓' : ''}
          </span>
          <span className={dsCheckbox('label')}>{children}</span>
        </>
      )}
    </AriaCheckbox>
  );
}
