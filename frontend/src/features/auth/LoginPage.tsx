import { Form, useActionData, useNavigation, Link } from 'react-router-dom';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import styles from './Auth.module.css';

export const LoginPage = () => {
  const actionData = useActionData() as { error?: string } | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Вхід</h1>
        <p className={styles.subtitle}>Раді бачити вас знову!</p>

        <Form method="post" className={styles.form}>
          <TextField
            label="Email"
            name="email"
            type="email"
            isRequired
            autoComplete="email"
            placeholder="your@email.com"
          />
          <TextField
            label="Пароль"
            name="password"
            type="password"
            isRequired
            autoComplete="current-password"
            placeholder="********"
          />

          {actionData?.error && (
            <div className={styles.errorMessage}>{actionData.error}</div>
          )}

          <Button type="submit" isLoading={isSubmitting} className={styles.submitButton}>
            Увійти
          </Button>
        </Form>

        <p className={styles.footer}>
          Немає акаунту? <Link to="/register">Зареєструватися</Link>
        </p>
      </div>
    </div>
  );
};
