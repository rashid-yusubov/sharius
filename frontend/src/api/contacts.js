import { buildHeaders, request } from './client.js';

export function searchUsers(query, token) {
  return request(`/users/search?query=${encodeURIComponent(query)}`, {
    headers: buildHeaders({ token }),
  });
}

export function getContacts(token) {
  return request('/contacts', {
    headers: buildHeaders({ token }),
  });
}

export function getIncomingContactRequests(token) {
  return request('/contacts/requests/incoming', {
    headers: buildHeaders({ token }),
  });
}

export function createContactRequest(userId, token) {
  return request('/contacts/requests', {
    method: 'POST',
    headers: buildHeaders({
      token,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
    body: JSON.stringify({ user_id: userId }),
  });
}

export function acceptContactRequest(requestId, token) {
  return request(`/contacts/requests/${encodeURIComponent(requestId)}/accept`, {
    method: 'POST',
    headers: buildHeaders({ token }),
  });
}

export function rejectContactRequest(requestId, token) {
  return request(`/contacts/requests/${encodeURIComponent(requestId)}/reject`, {
    method: 'POST',
    headers: buildHeaders({ token }),
  });
}

export function deleteContact(userId, token) {
  return request(`/contacts/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: buildHeaders({ token }),
  });
}
