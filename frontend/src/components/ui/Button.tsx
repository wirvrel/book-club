import { Button as RACButton, ButtonProps as RACButtonProps } from 'react-aria-components';
import styles from './Button.module.css';
import clsx from 'clsx';

interface ButtonProps extends RACButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', isLoading, className, children, ...props }: ButtonProps) {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(className, (className, renderProps) => 
        clsx(
          styles.button,
          styles[variant],
          styles[size],
          renderProps.isPressed && styles.pressed,
          renderProps.isHovered && styles.hovered,
          renderProps.isFocusVisible && styles.focused,
          renderProps.isDisabled && styles.disabled,
          className
        )
      )}
    >
      {isLoading ? 'Завантаження...' : children}
    </RACButton>
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
