import type { ValidationResult } from '@/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) return { valid: false, error: 'Email is required.' };
  if (!EMAIL_REGEX.test(email.trim()))
    return { valid: false, error: 'Enter a valid email address.' };
  return { valid: true, error: null };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) return { valid: false, error: 'Password is required.' };
  if (password.length < MIN_PASSWORD_LENGTH)
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  return { valid: true, error: null };
}

export function validatePasswordMatch(
  password: string,
  confirm: string,
): ValidationResult {
  if (confirm !== password)
    return { valid: false, error: 'Passwords do not match.' };
  return { valid: true, error: null };
}
