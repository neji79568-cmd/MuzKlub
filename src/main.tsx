import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { api, ApiError } from './api';
import type { Choice, FieldErrors, ProfileInput, User } from './api';
import './styles.css';

const defaultChoices: Choice[] = [
  { value: 'vocals', label: 'Вокал' }, { value: 'guitar', label: 'Гитара' },
  { value: 'bass', label: 'Бас-гитара' }, { value: 'drums', label: 'Ударные' },
  { value: 'keys', label: 'Клавишные' }, { value: 'other', label: 'Другое' },
];

type Notice = { type: 'error' | 'success'; text: string } | null;

function App() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [choices, setChoices] = useState(defaultChoices);
  const [loading, setLoading] = useState('Загружаем личный кабинет…');
  const [notice, setNotice] = useState<Notice>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void api.specializations().then(setChoices).catch(() => {});
    void api.profile().then(setUser).catch((error: unknown) => {
      if (!(error instanceof ApiError) || ![401, 403].includes(error.status)) {
        setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Не удалось загрузить профиль.' });
      }
    }).finally(() => { setLoading(''); setReady(true); });
  }, []);

  function showError(error: unknown) {
    if (error instanceof ApiError && [401, 403].includes(error.status) && user) {
      setUser(null);
      setEditing(false);
      setNotice({ type: 'error', text: 'Сессия завершилась. Войдите в аккаунт ещё раз.' });
    } else {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Не удалось выполнить запрос.' });
    }
    setErrors(error instanceof ApiError ? error.fields : {});
  }

  function switchMode(next: 'login' | 'register') {
    setMode(next);
    setNotice(null);
    setErrors({});
  }

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    setNotice(null);
    setErrors({});
    if (mode === 'register' && password !== form.get('password_confirmation')) {
      setErrors({ password_confirmation: 'Пароли не совпадают.' });
      return;
    }
    setLoading(mode === 'login' ? 'Входим в аккаунт…' : 'Создаём аккаунт…');
    try {
      const action = mode === 'login' ? api.login : api.register;
      await action(String(form.get('username')).trim(), password);
      const current = await api.profile();
      setUser(current);
      setEditing(mode === 'register');
      setNotice({ type: 'success', text: mode === 'register' ? 'Аккаунт создан. Расскажите о себе!' : 'Вы вошли в аккаунт.' });
    } catch (error) { showError(error); }
    finally { setLoading(''); }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    const form = new FormData(event.currentTarget);
    const profile: ProfileInput = {
      first_name: String(form.get('first_name')).trim(),
      specialization: String(form.get('specialization')) as ProfileInput['specialization'],
      bio: String(form.get('bio')).trim(),
      fee: String(form.get('fee')).replace(',', '.'),
    };
    setLoading('Сохраняем профиль…');
    setNotice(null);
    setErrors({});
    try {
      await api.updateProfile(profile);
      setUser(await api.profile());
      setEditing(false);
      setNotice({ type: 'success', text: 'Изменения сохранены.' });
    } catch (error) { showError(error); }
    finally { setLoading(''); }
  }

  async function logout() {
    if (loading) return;
    setLoading('Выходим из аккаунта…');
    setNotice(null);
    setErrors({});
    try {
      await api.logout();
      setUser(null);
      setEditing(false);
      setMode('login');
      setNotice({ type: 'success', text: 'Вы вышли из аккаунта.' });
    } catch (error) { showError(error); }
    finally { setLoading(''); }
  }

  const fieldError = (name: string) => errors[name] ? <span className="field-error" id={`${name}-error`}>{errors[name]}</span> : null;
  const fieldProps = (name: string) => ({ 'aria-invalid': !!errors[name], 'aria-describedby': errors[name] ? `${name}-error` : undefined });
  const profile = user?.profile;

  return <>
    {loading && <div className="loading-banner" role="status"><span className="spinner" />{loading}</div>}
    <header className="site-header shell">
      <a className="brand" href="#" aria-label="MuzKlub — главная"><span className="brand-icon" aria-hidden="true">M</span><span className="brand-name">muzklub<span>МУЗЫКАЛЬНАЯ ГРУППА</span></span></a>
      <a className="member-link" href="#account">{user ? `@${user.username}` : 'Кабинет участника'} <span aria-hidden="true">↗</span></a>
    </header>

    <main className="shell main-grid">
      <section className="intro" aria-labelledby="band-title">
        <p className="eyebrow"><span aria-hidden="true">●</span> НА ОДНОЙ ВОЛНЕ</p>
        <h1 id="band-title">Соберёмся.<br /><span>Сыграем.</span></h1>
        <p className="intro-copy">Хорошая музыка начинается с людей.<br />Это место нашей группы — и твой личный кабинет в ней.</p>
        <div className="band-tags"><span className="tag">Живой звук</span><span className="tag">Общий ритм</span><span className="tag">Свои люди</span></div>
        <div className="record-scene" aria-hidden="true"><div className="vinyl"><div className="vinyl-label">MUZ<br /><strong>KLUB</strong><small>SIDE A · 33 RPM</small></div></div><span className="record-caption">Всё начинается<br />с первой ноты.</span></div>
      </section>

      <section className="account-card" id="account" aria-labelledby="account-title" aria-busy={!!loading}>
        <p className="card-kicker">BACKSTAGE / ЛИЧНЫЙ КАБИНЕТ</p>
        <div className="card-heading"><h2 id="account-title">{user ? editing ? 'Редактировать профиль' : 'Твой профиль' : mode === 'login' ? 'С возвращением' : 'Присоединяйся'}</h2><p>{user ? 'Твоя партия в нашей группе.' : mode === 'login' ? 'Войди, чтобы быть в ритме группы.' : 'Создай аккаунт участника группы.'}</p></div>

        {notice && <div className={`notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</div>}

        {!user ? <>
          <div className="tabs" aria-label="Вход или регистрация"><button type="button" className={`tab ${mode === 'login' ? 'active' : ''}`} aria-pressed={mode === 'login'} disabled={!!loading} onClick={() => switchMode('login')}>Вход</button><button type="button" className={`tab ${mode === 'register' ? 'active' : ''}`} aria-pressed={mode === 'register'} disabled={!!loading} onClick={() => switchMode('register')}>Регистрация</button></div>
          <form key={mode} onSubmit={authenticate}>
            <div className="form-field"><label htmlFor="username">Логин</label><input id="username" name="username" autoComplete="username" placeholder="Твой логин" required maxLength={150} pattern="[\p{L}\p{N}_@.+\-]+" disabled={!!loading} {...fieldProps('username')} /><span className="field-hint">Буквы, цифры и символы @ . + - _</span>{fieldError('username')}</div>
            <div className="form-field"><label htmlFor="password">Пароль</label><input id="password" name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'register' ? 'Не меньше 6 символов' : 'Введи пароль'} required minLength={mode === 'register' ? 6 : undefined} disabled={!!loading} {...fieldProps('password')} />{fieldError('password')}</div>
            {mode === 'register' && <div className="form-field"><label htmlFor="password_confirmation">Повтори пароль</label><input id="password_confirmation" name="password_confirmation" type="password" autoComplete="new-password" placeholder="Ещё раз, для уверенности" required minLength={6} disabled={!!loading} {...fieldProps('password_confirmation')} />{fieldError('password_confirmation')}</div>}
            <button className="primary-button" type="submit" disabled={!!loading || !ready}>{loading ? 'Подожди…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'} <span aria-hidden="true">↗</span></button>
          </form>
          <p className="card-footer">{mode === 'login' ? 'Ещё нет аккаунта?' : 'Уже в группе?'} <button className="text-button" type="button" disabled={!!loading} onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Зарегистрироваться' : 'Войти'}</button></p>
        </> : profile && <>
          <div className="profile-heading"><div className="avatar" aria-hidden="true">{(profile.first_name || user.username).slice(0, 1).toUpperCase()}</div><div><h3>{profile.first_name || user.username}</h3><span className="member-id">@{user.username}</span></div></div>
          {editing ? <form className="profile-form" onSubmit={saveProfile}>
            <div className="form-grid">
              <div className="form-field full-width"><label htmlFor="first_name">Имя</label><input id="first_name" name="first_name" autoComplete="given-name" defaultValue={profile.first_name} placeholder="Как тебя зовут?" maxLength={100} disabled={!!loading} {...fieldProps('first_name')} />{fieldError('first_name')}</div>
              <div className="form-field"><label htmlFor="specialization">Твоя партия</label><select id="specialization" name="specialization" defaultValue={profile.specialization || 'other'} disabled={!!loading} {...fieldProps('specialization')}>{choices.map(choice => <option key={choice.value} value={choice.value}>{choice.label}</option>)}</select>{fieldError('specialization')}</div>
              <div className="form-field"><label htmlFor="fee">Гонорар</label><input id="fee" name="fee" type="number" step="0.01" min="0" max="99999999.99" defaultValue={profile.fee || '0.00'} required disabled={!!loading} {...fieldProps('fee')} />{fieldError('fee')}</div>
              <div className="form-field full-width"><label htmlFor="bio">О себе</label><textarea id="bio" name="bio" rows={4} defaultValue={profile.bio} placeholder="Что играешь, что слушаешь, чем живёшь…" disabled={!!loading} {...fieldProps('bio')} />{fieldError('bio')}</div>
            </div>
            <div className="form-actions"><button className="primary-button" type="submit" disabled={!!loading}>Сохранить профиль <span aria-hidden="true">↗</span></button><button className="secondary-button" type="button" disabled={!!loading} onClick={() => { setEditing(false); setNotice(null); setErrors({}); }}>Отмена</button></div>
          </form> : <><dl className="profile-summary"><div className="summary-item"><dt className="summary-label">Твоя партия</dt><dd className="summary-value">{profile.specialization_display || choices.find(choice => choice.value === profile.specialization)?.label || 'Не указана'}</dd></div><div className="summary-item"><dt className="summary-label">Гонорар</dt><dd className="summary-value">{profile.fee || '0.00'}</dd></div><div className="summary-item full-width"><dt className="summary-label">О себе</dt><dd className="summary-value">{profile.bio || 'Здесь пока тихо. Расскажи немного о себе.'}</dd></div></dl><button className="primary-button" type="button" disabled={!!loading} onClick={() => { setEditing(true); setNotice(null); setErrors({}); }}>Редактировать профиль <span aria-hidden="true">↗</span></button></>}
          <p className="card-footer"><button className="text-button" type="button" disabled={!!loading} onClick={logout}>Выйти из аккаунта</button></p>
        </>}
      </section>
    </main>
    <footer className="site-footer shell"><span>© {new Date().getFullYear()} MuzKlub</span><span>Люди. Музыка. Один ритм.</span></footer>
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);
