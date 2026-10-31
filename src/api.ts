export interface Profile {
  first_name: string;
  specialization: string;
  specialization_display?: string;
  bio: string;
  fee: string;
}

export interface User {
  id: number;
  username: string;
  profile: Profile;
}

export interface Choice {
  value: string;
  label: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const API_URL = 'https://inai-col2.fishrungames.com/api';

async function request<T>(path: string, method = 'GET', body?: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/${path}/`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new Error('Нет связи с сервером. Попробуйте ещё раз.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data ? Object.values(data).flat().join(' ') : 'Ошибка сервера.';
    throw new ApiError(response.status, message);
  }
  return data;
}

export const api = {
  register: (username: string, password: string) => request<User>('register', 'POST', { username, password }),
  login: (username: string, password: string) => request<User>('login', 'POST', { username, password }),
  logout: () => request<unknown>('logout', 'POST'),
  profile: () => request<User>('profile'),
  updateProfile: (profile: Profile) => request<User>('profile', 'PATCH', profile),
  specializations: () => request<Choice[]>('specializations'),
};
