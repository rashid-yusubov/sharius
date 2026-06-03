import { buildHeaders, getApiUrl, request } from './client.js';

export function createSession({ custom_code, content = '', token }) {
  return request('/sessions', {
    method: 'POST',
    headers: buildHeaders({
      token,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
    body: JSON.stringify({ custom_code, content }),
  });
}

export function createSessionForContact(userId, { custom_code, content = '', token }) {
  return request(`/sessions/for-contact/${encodeURIComponent(userId)}`, {
    method: 'POST',
    headers: buildHeaders({
      token,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
    body: JSON.stringify({ custom_code, content }),
  });
}

export function getSession(code) {
  return request(`/sessions/${encodeURIComponent(code)}`);
}

export function updateSessionText(code, { content, token, creatorToken }) {
  return request(`/sessions/${encodeURIComponent(code)}/text`, {
    method: 'PUT',
    headers: buildHeaders({
      token,
      creatorToken,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
    body: JSON.stringify({ content }),
  });
}

export function uploadSessionFile(code, file, { token, creatorToken } = {}) {
  const formData = new FormData();
  formData.append('file', file);

  return request(`/sessions/${encodeURIComponent(code)}/files`, {
    method: 'POST',
    headers: buildHeaders({ token, creatorToken }),
    body: formData,
  });
}

export function deleteSessionFile(code, fileId, { token, creatorToken } = {}) {
  return request(`/sessions/${encodeURIComponent(code)}/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: buildHeaders({ token, creatorToken }),
  });
}

export function deleteSession(code, { token, creatorToken } = {}) {
  return request(`/sessions/${encodeURIComponent(code)}`, {
    method: 'DELETE',
    headers: buildHeaders({ token, creatorToken }),
  });
}

export function getSessionFileDownloadUrl(code, fileId) {
  return getApiUrl(`/sessions/${encodeURIComponent(code)}/files/${encodeURIComponent(fileId)}`);
}
