import {
  TextField as AriaTextField,
  TextFieldProps as AriaTextFieldProps,
  Input,
  TextArea,
  Label,
  Text,
  FieldError,
} from 'react-aria-components';
import styles from './TextField.module.css';
import clsx from 'clsx';

interface TextFieldProps extends AriaTextFieldProps {
  label?: string;
  description?: string;
  errorMessage?: string;
  placeholder?: string;
  multiline?: boolean;
  size?: 'sm' | 'md';
}

export function TextField({ label, description, errorMessage, placeholder, multiline, size = 'md', className, ...props }: TextFieldProps) {
  return (
    <AriaTextField
      {...props}
      className={composeRenderProps(className, (className) => clsx(styles.field, styles[size], className))}
    >
      {label && <Label className={styles.label}>{label}</Label>}
      {multiline ? (
        <TextArea className={styles.input} placeholder={placeholder} />
      ) : (
        <Input className={styles.input} placeholder={placeholder} />
      )}
      {description && (
        <Text slot="description" className={styles.description}>
          {description}
        </Text>
      )}
      <FieldError className={styles.error}>{errorMessage}</FieldError>
    </AriaTextField>
  );
}

function composeRenderProps<T>(
  className: string | ((renderProps: T) => string) | undefined,
  children: (className: string, renderProps: T) => string
) {
  return (renderProps: T) => {
    if (typeof className === 'function') {
      return children(className(renderProps), renderProps);
    }
    return children(className || '', renderProps);
  };
}
export type { TextFieldProps };
