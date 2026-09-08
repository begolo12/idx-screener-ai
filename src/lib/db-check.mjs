export function isDbConfigured(url) {
  return typeof url === 'string' && url.trim().startsWith('postgres');
}
