// Client-side checks mirroring the backend's rules. Each returns an i18n error key or null.

const NAME_RE = /^[^\d<>{}[\]@#$%^&*=+|\\/:;"]{1,50}$/;

export const nameError = (v) => (!v.trim() ? 'required' : NAME_RE.test(v.trim().replace(/\s+/g, ' ')) ? null : 'invalidName');

export const phoneError = (v) => {
  const digits = v.replace(/\D/g, '');
  return !digits ? 'required' : digits.length >= 10 && digits.length <= 15 ? null : 'invalidPhone';
};

export const emailError = (v) => (!v.trim() || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()) ? null : 'invalidEmail');

export const addressError = (v) => (v.trim().length >= 3 ? null : v.trim() ? 'invalidAddress' : 'required');

export const last4Error = (v) => (/^\d{4}$/.test(v) ? null : v ? 'invalidLast4' : 'required');

export const requiredError = (v) => (v && v.trim() ? null : 'required');

/** Returns an object of {field: errorKey} for the non-null errors. */
export function collect(checks) {
  return Object.fromEntries(Object.entries(checks).filter(([, v]) => v));
}
