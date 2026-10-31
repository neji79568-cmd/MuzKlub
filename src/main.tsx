import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { api, ApiError } from './api';
import type { Choice, User } from './api';
import './styles.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [editing, setEditing] = useState(false);
  const [choices, setChoices] = useState<Choice[]>([
    { value: 'vocals', label: 'Вокал' },
    { value: 'guitar', label: 'Гитара' },
    { value: 'bass', label: 'Бас-гитара' },
    { value: 'drums', label: 'Ударные' },
    { value: 'keys', label: 'Клавишные' },
    { value: 'other', label: 'Другое' },
  ]);
  const [loading, setLoading] = useState('Загрузка...');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.specializations().then(setChoices).catch(() => {
      setMessage('Не удалось загрузить список инструментов. Обновите страницу.');
    });
    api.profile().then(setUser).catch((error: unknown) => {
      if (!(error instanceof ApiError) || ![401, 403].includes(error.status)) {
        setMessage('Не удалось загрузить профиль. Попробуйте ещё раз.');
      }
    }).finally(() => setLoading(''));
  }, []);

  function showError(error: unknown) {
    if (error instanceof ApiError && [401, 403].includes(error.status) && user) {
      setUser(null);
      setEditing(false);
      setMessage('Сессия закончилась. Войдите снова.');
      return;
    }
    setMessage(error instanceof Error ? error.message : 'Произошла ошибка.');
  }

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const form = new FormData(event.currentTarget);
    const username = String(form.get('username')).trim();
    const password = String(form.get('password'));
    if (mode === 'register' && password !== form.get('password_confirmation')) {
      setMessage('Пароли не совпадают.');
      return;
    }
    setLoading('Загрузка...');
    setMessage('');
    try {
      if (mode === 'register') await api.register(username, password);
      else await api.login(username, password);
      setUser(await api.profile());
      setEditing(mode === 'register');
      setMessage(mode === 'register' ? 'Аккаунт создан.' : 'Вы вошли в аккаунт.');
    } catch (error) {
      showError(error);
    } finally {
      setLoading('');
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const form = new FormData(event.currentTarget);
    setLoading('Сохранение...');
    setMessage('');
    try {
      await api.updateProfile({
        first_name: String(form.get('first_name')).trim(),
        specialization: String(form.get('specialization')),
        bio: String(form.get('bio')).trim(),
        fee: String(form.get('fee')),
      });
      setUser(await api.profile());
      setEditing(false);
      setMessage('Изменения сохранены.');
    } catch (error) {
      showError(error);
    } finally {
      setLoading('');
    }
  }

  async function logout() {
    if (loading) return;
    setLoading('Выход...');
    setMessage('');
    try {
      await api.logout();
      setUser(null);
      setEditing(false);
      setMode('login');
      setMessage('Вы вышли из аккаунта.');
    } catch (error) {
      showError(error);
    } finally {
      setLoading('');
    }
  }

  return <main>
    <h1>MuzKlub</h1>
    <p>Сайт музыкальной группы</p>
    {loading && <p className="loading" role="status">{loading}</p>}
    {message && <p className="message" role="status">{message}</p>}

    {!user ? <>
      <div className="buttons">
        <button disabled={!!loading} onClick={() => { setMode('login'); setMessage(''); }}>Вход</button>
        <button disabled={!!loading} onClick={() => { setMode('register'); setMessage(''); }}>Регистрация</button>
      </div>
      <h2>{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>
      <form key={mode} onSubmit={authenticate}>
        <fieldset disabled={!!loading}>
          <label>Логин
            <input id="username" name="username" required maxLength={150} autoComplete="username" />
          </label>
          <label>Пароль
            <input id="password" name="password" type="password" required minLength={mode === 'register' ? 6 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </label>
          {mode === 'register' && <label>Повторите пароль
            <input id="password_confirmation" name="password_confirmation" type="password" required minLength={6} autoComplete="new-password" />
          </label>}
          <button type="submit">{mode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
        </fieldset>
      </form>
    </> : <section className="profile">
      <h2>{editing ? 'Редактировать профиль' : 'Мой профиль'}</h2>
      <p>Логин: {user.username}</p>
      {editing ? <form onSubmit={saveProfile}>
        <fieldset disabled={!!loading}>
          <label>Имя
            <input id="first_name" name="first_name" defaultValue={user.profile.first_name} maxLength={100} />
          </label>
          <label>Инструмент
            <select id="specialization" name="specialization" defaultValue={user.profile.specialization || 'other'}>
              {choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
            </select>
          </label>
          <label>О себе
            <textarea id="bio" name="bio" rows={4} defaultValue={user.profile.bio} />
          </label>
          <label>Гонорар
            <input id="fee" name="fee" type="number" min="0" max="99999999.99" step="0.01" required defaultValue={user.profile.fee || '0.00'} />
          </label>
          <button type="submit">Сохранить профиль</button>{' '}
          <button type="button" onClick={() => { setEditing(false); setMessage(''); }}>Отмена</button>
        </fieldset>
      </form> : <>
        <div className="profile-summary">
          <p>Имя: {user.profile.first_name || 'Не указано'}</p>
          <p>Инструмент: {user.profile.specialization_display || 'Не указан'}</p>
          <p>О себе: {user.profile.bio || 'Не заполнено'}</p>
          <p>Гонорар: {user.profile.fee}</p>
        </div>
        <button disabled={!!loading} onClick={() => { setEditing(true); setMessage(''); }}>Редактировать профиль</button>
      </>}
      <p><button disabled={!!loading} onClick={logout}>Выйти из аккаунта</button></p>
    </section>}
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
