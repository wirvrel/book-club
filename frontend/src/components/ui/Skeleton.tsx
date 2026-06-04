import styles from './Skeleton.module.css';
import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'rectangular', width, height }: SkeletonProps) {
  return (
    <div 
      className={clsx(styles.skeleton, styles[variant], className)}
      style={{ width, height }}
    />
  );
}
