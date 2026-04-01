import type { ComponentProps, JSX, ReactNode } from 'react';
import { Switch as AriaSwitch } from 'react-aria-components';
import { switchStyles } from '@examples/design-system';

export type SwitchProps = Omit<ComponentProps<typeof AriaSwitch>, 'children'> & {
  children?: ReactNode;
};

export function Switch({ children, ...props }: SwitchProps): JSX.Element {
  return (
    <AriaSwitch {...props} className={switchStyles('root')}>
      {({ isSelected }) => (
        <>
          <span className={switchStyles('track')} data-selected={isSelected || undefined}>
            <span className={switchStyles('thumb')} data-selected={isSelected || undefined} />
          </span>
          <span className={switchStyles('label')}>{children}</span>
        </>
      )}
    </AriaSwitch>
  );
}
