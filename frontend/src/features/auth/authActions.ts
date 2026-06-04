import { redirect } from 'react-router-dom';
import { authApi } from './authApi';
import { store } from '../../app/store';

export const loginAction = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const result = await store.dispatch(
      authApi.endpoints.login.initiate({ email, password })
    ).unwrap();

    if (result.success && result.data.accessToken) {
      localStorage.setItem('accessToken', result.data.accessToken);
      return redirect('/');
    }
    
    return { error: 'Невідома помилка при вході' };
  } catch (err: any) {
    return { 
      error: err.data?.error?.message || 'Невірний email або пароль' 
    };
  }
};

export const registerAction = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const result = await store.dispatch(
      authApi.endpoints.register.initiate({ username, email, password })
    ).unwrap();

    if (result.success && result.data.accessToken) {
      localStorage.setItem('accessToken', result.data.accessToken);
      return redirect('/');
    }
    
    return { error: 'Невідома помилка при реєстрації' };
  } catch (err: any) {
    return { 
      error: err.data?.error?.message || 'Помилка при реєстрації. Можливо, цей email вже зайнятий.' 
    };
  }
};
