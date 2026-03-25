import { FieldError, Label, TextArea, TextField as AriaTextField } from 'react-aria-components';
import { textAreaField } from '@examples/design-system';
import type { BaseTextFieldProps } from './utils';

export type TextAreaFieldProps = BaseTextFieldProps & {
  placeholder?: string;
};

export function TextAreaField({
  label,
  description,
  errorMessage,
  placeholder,
  ...props
}: TextAreaFieldProps) {
  return (
    <AriaTextField {...props} className={textAreaField('root')}>
      {label ? <Label className={textAreaField('label')}>{label}</Label> : null}
      <TextArea className={textAreaField('input')} placeholder={placeholder} />
      {description ? <p className={textAreaField('description')}>{description}</p> : null}
      <FieldError className={textAreaField('error')}>{errorMessage ?? ''}</FieldError>
    </AriaTextField>
  );
}
