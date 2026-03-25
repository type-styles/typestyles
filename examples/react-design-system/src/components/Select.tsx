import type { ComponentProps } from 'react';
import {
  Button as AriaButton,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
} from 'react-aria-components';
import { dsSelect } from '@examples/design-system';

export type SelectOption = {
  id: string;
  label: string;
};

export type SelectProps = Omit<ComponentProps<typeof AriaSelect>, 'children'> & {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
};

export function Select({ label, options, placeholder = 'Select…', ...props }: SelectProps) {
  return (
    <AriaSelect {...props} className={dsSelect('root')}>
      {label ? <Label className={dsSelect('label')}>{label}</Label> : null}
      <AriaButton className={dsSelect('trigger')}>
        <SelectValue>{({ defaultChildren }) => defaultChildren ?? placeholder}</SelectValue>
      </AriaButton>
      <Popover className={dsSelect('popover')}>
        <ListBox>
          {options.map((option) => (
            <ListBoxItem key={option.id} id={option.id} className={dsSelect('item')}>
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}
