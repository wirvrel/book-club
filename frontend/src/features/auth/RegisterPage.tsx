import { Form, useActionData, useNavigation, Link } from 'react-router-dom';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import styles from './Auth.module.css';

export const RegisterPage = () => {
  const actionData = useActionData() as { error?: string } | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Реєстрація</h1>
        <p className={styles.subtitle}>Приєднуйтесь до нашої спільноти!</p>

        <Form method="post" className={styles.form}>
          <TextField
            label="Ім'я користувача"
            name="username"
            type="text"
            isRequired
            minLength={3}
            maxLength={50}
            placeholder="книголюб_3000"
          />
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
            minLength={8}
            autoComplete="new-password"
            placeholder="********"
          />

          {actionData?.error && (
            <div className={styles.errorMessage}>{actionData.error}</div>
          )}

          <Button type="submit" isLoading={isSubmitting} className={styles.submitButton}>
            Зареєструватися
          </Button>
        </Form>

        <p className={styles.footer}>
          Вже маєте акаунт? <Link to="/login">Увійти</Link>
        </p>
      </div>
    </div>
  );
};
