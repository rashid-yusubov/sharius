export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export class ApiError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

const readJsonSafely = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError('INVALID_JSON_RESPONSE');
  }
};

export const buildHeaders = ({ token, creatorToken, headers } = {}) => {
  const result = { ...headers };

  if (token) {
    result.Authorization = `Bearer ${token}`;
  }

  if (creatorToken) {
    result['X-Creator-Token'] = creatorToken;
  }

  return result;
};

export async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const payload = await readJsonSafely(response);

  if (!response.ok) {
    const errorCode = payload?.detail?.error?.code || payload?.error?.code || `HTTP_${response.status}`;
    throw new ApiError(errorCode);
  }

  if (!payload?.success) {
    throw new ApiError(payload?.error?.code || 'REQUEST_FAILED');
  }

  return payload.data;
}

export const getApiUrl = (path) => `${API_BASE_URL}${path}`;
