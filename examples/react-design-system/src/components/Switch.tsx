import type { ComponentProps, ReactNode } from 'react';
import { Switch as AriaSwitch } from 'react-aria-components';
import { dsSwitch } from '@examples/design-system';

export type SwitchProps = Omit<ComponentProps<typeof AriaSwitch>, 'children'> & {
  children?: ReactNode;
};

export function Switch({ children, ...props }: SwitchProps) {
  return (
    <AriaSwitch {...props} className={dsSwitch('root')}>
      {({ isSelected }) => (
        <>
          <span className={dsSwitch('track')} data-selected={isSelected || undefined}>
            <span className={dsSwitch('thumb')} data-selected={isSelected || undefined} />
          </span>
          <span className={dsSwitch('label')}>{children}</span>
        </>
      )}
    </AriaSwitch>
  );
}
