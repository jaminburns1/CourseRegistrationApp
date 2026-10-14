
async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`/api${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error('Cannot connect to the server.');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    const error = new Error(
      data?.error?.message || 'Something went wrong.'
    );

    error.code = data?.error?.code;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = Object.assign(request, {
  get(path) {
    return request(path);
  },

  post(path, data) {
    return request(path, {
      method: 'POST',
      body: JSON.stringify(data ?? {})
    });
  },

  delete(path) {
    return request(path, {
      method: 'DELETE'
    });
  }
});
