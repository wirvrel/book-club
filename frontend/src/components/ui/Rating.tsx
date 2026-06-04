import { RadioGroup, Radio, Label, ValidationResult, FieldError } from 'react-aria-components';
import styles from './Rating.module.css';
import { Star } from 'lucide-react';
import clsx from 'clsx';

interface RatingProps {
  label?: string;
  name?: string;
  value: number;
  onChange: (value: number) => void;
  errorMessage?: string;
}

export function Rating({ label, name, value, onChange, errorMessage }: RatingProps) {
  return (
    <RadioGroup 
      name={name} 
      value={value.toString()} 
      onChange={(val) => onChange(parseInt(val))}
      className={styles.group}
    >
      {label && <Label className={styles.label}>{label}</Label>}
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Radio 
            key={star} 
            value={star.toString()} 
            className={({ isSelected, isFocusVisible }) => clsx(
              styles.starRadio,
              star <= value && styles.selected,
              isFocusVisible && styles.focused
            )}
          >
            <Star fill={star <= value ? 'currentColor' : 'none'} size={24} />
          </Radio>
        ))}
      </div>
      {errorMessage && <div className={styles.error}>{errorMessage}</div>}
    </RadioGroup>
  );
}
