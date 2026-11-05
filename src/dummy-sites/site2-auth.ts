const EMAIL_PATTERN = /^@[a-zA-Z0-9._%+-]+[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string): boolean {
  const value = email.trim();
  if (value.length === 0 || value.length > 254) {
    return false;
  }
  return EMAIL_PATTERN.test(value);
}
