export const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  if (typeof window === 'undefined') {
    return envUrl || 'http://127.0.0.1:9000';
  }

  const currentHostname = window.location.hostname;
  const currentProtocol = window.location.protocol;

  if (envUrl) {
    try {
      const url = new URL(envUrl);
      // If configured for localhost/127.0.0.1, but opened from another device on LAN (e.g. phone via 192.168.x.x):
      if (
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1') &&
        currentHostname &&
        currentHostname !== 'localhost' &&
        currentHostname !== '127.0.0.1'
      ) {
        url.hostname = currentHostname;
        return url.origin;
      }
      return envUrl;
    } catch {
      // ignore URL parsing error
    }
  }

  return `${currentProtocol}//${currentHostname || 'localhost'}:9000`;
};

export const API_BASE_URL = resolveApiBaseUrl();

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
  const baseUrl = resolveApiBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, options);
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

export const getApiUrl = (path) => `${resolveApiBaseUrl()}${path}`;
