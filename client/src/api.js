export const getPassword = () => sessionStorage.getItem('qa_pw') || '';
export const setPassword = (p) => sessionStorage.setItem('qa_pw', p);

export async function apiFetch(url, opts = {}) {
  const pw = getPassword();
  const headers = { ...(opts.headers || {}) };
  if (pw) headers['x-app-password'] = pw;
  return fetch(url, { ...opts, headers });
}
