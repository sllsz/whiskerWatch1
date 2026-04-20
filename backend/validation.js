/**
 * Input validation for WhiskerWatch API endpoints.
 *
 * Hand-rolled validators that return { valid: true, data } on success
 * or { valid: false, error: string } on failure. Each validator
 * sanitizes and coerces inputs to the expected types.
 */

import { METRICS, SYMPTOMS } from './constants.js';

/**
 * Validates and coerces a URL param that should be a positive integer (e.g., :catId).
 * @param {string} raw
 * @param {string} paramName - Used in error messages
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function validateIntParam(raw, paramName) {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { valid: false, error: `${paramName} must be a positive integer` };
  }
  return { valid: true, value: parsed };
}

/**
 * Validates a date string in YYYY-MM-DD format.
 * @param {string} raw
 * @returns {{ valid: boolean, error?: string }}
 */
function isValidDate(raw) {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const d = new Date(raw + 'T00:00:00');
  return !isNaN(d.getTime());
}

/**
 * Validates the request body for creating or updating a cat profile.
 * @param {object} body
 * @returns {{ valid: boolean, data?: object, error?: string }}
 */
export function validateCatBody(body) {
  const { name, breed, birth_date, weight } = body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return { valid: false, error: 'Name is required' };
  }
  if (name.trim().length > 30) {
    return { valid: false, error: 'Name must be 30 characters or less' };
  }

  const cleanBreed = typeof breed === 'string' ? breed.trim().slice(0, 50) : '';
  const cleanBirthDate = (typeof birth_date === 'string' && isValidDate(birth_date)) ? birth_date : '';
  const cleanWeight = (typeof weight === 'number' || typeof weight === 'string')
    ? Math.max(0, Math.min(50, Number(weight) || 0))
    : 0;

  return {
    valid: true,
    data: { name: name.trim(), breed: cleanBreed, birth_date: cleanBirthDate, weight: cleanWeight },
  };
}

/**
 * Validates the request body for creating or updating a daily log.
 * Coerces metric values to integers 1–5 and symptom flags to 0/1.
 *
 * @param {object} body
 * @returns {{ valid: boolean, data?: object, error?: string }}
 */
export function validateLogBody(body) {
  const { date, notes, ...rest } = body || {};

  if (!date) {
    return { valid: false, error: 'Date is required' };
  }
  if (!isValidDate(date)) {
    return { valid: false, error: 'Date must be a valid YYYY-MM-DD string' };
  }

  // Validate and clamp each metric to 1–5
  const data = { date, notes: typeof notes === 'string' ? notes.slice(0, 500) : '' };
  for (const m of METRICS) {
    const raw = Number(rest[m]);
    if (isNaN(raw) || raw < 1 || raw > 5) {
      return { valid: false, error: `${m} must be an integer between 1 and 5` };
    }
    data[m] = Math.round(raw);
  }

  // Coerce symptom flags to 0 or 1
  for (const s of SYMPTOMS) {
    data[s] = rest[s] ? 1 : 0;
  }

  return { valid: true, data };
}
