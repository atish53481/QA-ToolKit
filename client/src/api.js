export const getPassword = () => sessionStorage.getItem('qa_pw') || '';
export const setPassword = (p) => sessionStorage.setItem('qa_pw', p);

export const getLLMConfig = () => { try { return JSON.parse(sessionStorage.getItem('llm_config') || 'null'); } catch { return null; } };
export const setLLMConfig = (cfg) => sessionStorage.setItem('llm_config', JSON.stringify(cfg));

export async function apiFetch(url, opts = {}) {
  const pw = getPassword();
  const headers = { ...(opts.headers || {}) };
  if (pw) headers['x-app-password'] = pw;
  return fetch(url, { ...opts, headers });
}
