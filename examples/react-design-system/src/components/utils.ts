import type { TextFieldProps as AriaTextFieldProps } from 'react-aria-components';
export { cx } from 'typestyles';

export type FieldMeta = {
  label?: string;
  description?: string;
  errorMessage?: string;
};

export type BaseTextFieldProps = Omit<AriaTextFieldProps, 'children'> & FieldMeta;
