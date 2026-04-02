const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split('=').slice(1).join('='));
};

export const withCsrf = (options: RequestInit = {}): RequestInit => {
  const method = (options.method ?? 'GET').toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return options;
  const token = getCookie('csrf_token');
  if (!token) return options;
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('x-csrf-token')) {
    headers.set('x-csrf-token', token);
  }
  return { ...options, headers };
};
