/**
 * Birth-date bounds for onboarding UI (local calendar), aligned with server age rules.
 */

/**
 * Latest local calendar date YYYY-MM-DD for a birth date such that the person is at least
 * `minAgeYears` old on `reference` (birthday on or before reference’s calendar date).
 */
export function maxBirthDateIsoForMinAge(
  minAgeYears: number,
  reference: Date = new Date(),
): string {
  const y = reference.getFullYear() - minAgeYears;
  const m = reference.getMonth();
  const d = reference.getDate();
  const dt = new Date(y, m, d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
