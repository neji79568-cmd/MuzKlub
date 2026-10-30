export type Specialization = 'vocals' | 'guitar' | 'bass' | 'drums' | 'keys' | 'other';

export interface Profile {
  first_name: string;
  specialization: Specialization;
  specialization_display: string;
  bio: string;
  fee: string;
}

export interface User {
  id: number;
  username: string;
  profile: Profile;
}

export type ProfileInput = Omit<Profile, 'specialization_display'>;
export interface Choice { value: Specialization; label: string }
export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields: FieldErrors = {}) {
    super(message);
  }
}

const API_URL = 'https://inai-col2.fishrungames.com/api';

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/${path}/`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new ApiError(0, 'Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.');
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const fields: FieldErrors = {};
    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        fields[key] = Array.isArray(value) ? value.join(' ') : String(value);
      }
    }
    throw new ApiError(response.status, fields.detail || fields.non_field_errors || 'Проверьте заполненные поля и попробуйте снова.', fields);
  }
  return data as T;
}

export const api = {
  login: (username: string, password: string) => request<User>('login', 'POST', { username, password }),
  register: (username: string, password: string) => request<User>('register', 'POST', { username, password }),
  logout: () => request<unknown>('logout', 'POST'),
  profile: () => request<User>('profile'),
  updateProfile: (profile: ProfileInput) => request<User>('profile', 'PATCH', profile),
  specializations: () => request<Choice[]>('specializations'),
};
