export const SENSITIVE_PATTERNS = ['KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'CREDENTIAL'];

export function isSensitive(name) {
  if (!name) return false;
  const upper = String(name).toUpperCase();
  return SENSITIVE_PATTERNS.some(p => upper.includes(p));
}

export function maskIfSensitive(name, value) {
  return isSensitive(name) ? '***' : value;
}
