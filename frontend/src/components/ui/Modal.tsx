import {
  Modal as RACModal,
  ModalOverlay as RACModalOverlay,
  Dialog as RACDialog,
  ModalOverlayProps,
  DialogProps,
  Heading,
  DialogRenderProps,
} from 'react-aria-components';
import styles from './Modal.module.css';
import clsx from 'clsx';
import { Button } from './Button';
import { X } from 'lucide-react';

interface CustomModalProps extends ModalOverlayProps {
  children: React.ReactNode;
}

export function Modal({ children, ...props }: CustomModalProps) {
  return (
    <RACModalOverlay
      {...props}
      className={(renderProps) =>
        clsx(styles.overlay, renderProps.isEntering && styles.entering, renderProps.isExiting && styles.exiting)
      }
    >
      <RACModal
        className={(renderProps) =>
          clsx(styles.modal, renderProps.isEntering && styles.entering, renderProps.isExiting && styles.exiting)
        }
      >
        {children}
      </RACModal>
    </RACModalOverlay>
  );
}

interface CustomDialogProps extends DialogProps {
  title?: string;
  children: React.ReactNode | ((opts: DialogRenderProps) => React.ReactNode);
}

export function Dialog({ title, children, ...props }: CustomDialogProps) {
  return (
    <RACDialog {...props} className={styles.dialog}>
      {(opts) => (
        <>
          <div className={styles.header}>
            {title && <Heading slot="title" className={styles.title}>{title}</Heading>}
            <Button variant="ghost" size="sm" onPress={opts.close} className={styles.closeButton}>
              <X size={20} />
            </Button>
          </div>
          <div className={styles.content}>
            {typeof children === 'function' ? children(opts) : children}
          </div>
        </>
      )}
    </RACDialog>
  );
}
