import { ReactNode } from 'react';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
}

export function StatsCard({ title, value, icon, color = 'primary' }: StatsCardProps) {
  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.iconWrapper}>
        {icon}
      </div>
      <div className={styles.content}>
        <div className={styles.value}>{value}</div>
        <div className={styles.title}>{title}</div>
      </div>
    </div>
  );
}
