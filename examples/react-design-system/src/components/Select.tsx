import type { ComponentProps, JSX } from 'react';
import {
  Button as AriaButton,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
} from 'react-aria-components';
import { select } from '@examples/design-system';

export type SelectOption = {
  id: string;
  label: string;
};

export type SelectProps = Omit<ComponentProps<typeof AriaSelect>, 'children'> & {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
};

export function Select({
  label,
  options,
  placeholder = 'Select…',
  ...props
}: SelectProps): JSX.Element {
  return (
    <AriaSelect {...props} className={select('root')}>
      {label ? <Label className={select('label')}>{label}</Label> : null}
      <AriaButton className={select('trigger')}>
        <SelectValue>{({ defaultChildren }) => defaultChildren ?? placeholder}</SelectValue>
      </AriaButton>
      <Popover className={select('popover')}>
        <ListBox>
          {options.map((option) => (
            <ListBoxItem key={option.id} id={option.id} className={select('item')}>
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}
