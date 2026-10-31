# MuzKlub

Простой учебный сайт музыкальной группы на React + TypeScript + Vite. Обычные формы без декоративных элементов. Работает с учебным API: https://inai-col2.fishrungames.com/api/docs/

Возможности: регистрация, вход, выход, просмотр и редактирование своего профиля (имя, инструмент, описание, гонорар). Есть плашка загрузки, блокировка повторной отправки и отображение ошибок сервера. Профиль сохраняется на бэкенде.

## Локальный запуск

Нужен Node.js 24.

```sh
npm ci
npm run dev
```

Откройте адрес, который напечатает Vite. Проверка TypeScript и production-сборка:

```sh
npm run build
npm run preview
```

## Авторизация

Запросы отправляются на `https://inai-col2.fishrungames.com/api/` с `credentials: 'include'`. Сервер хранит сессию в cookie `sessionid` (`HttpOnly; Secure; SameSite=None`). Пароль не сохраняется в приложении. После перезагрузки приложение получает текущий профиль с сервера. Для работы входа браузер должен разрешать cookie учебного API.

Методы: `POST /register/`, `POST /login/`, `POST /logout/`, `GET /profile/`, `PATCH /profile/`, `GET /specializations/`.

## GitHub Pages

Публикация: https://neji79568-cmd.github.io/MuzKlub/

Workflow `.github/workflows/pages.yml` запускается при push в `main`: `npm ci`, проверка TypeScript и сборка, загрузка `dist`, публикация на Pages. Источник Pages в настройках репозитория — **GitHub Actions**. Путь `/MuzKlub/` задан в `vite.config.ts`; workflow также передаёт имя репозитория в `--base`.
