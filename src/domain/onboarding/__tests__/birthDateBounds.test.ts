import { maxBirthDateIsoForMinAge } from '../birthDateBounds';

describe('maxBirthDateIsoForMinAge', () => {
  it('returns reference date minus minAge years (not end of that calendar year)', () => {
    const ref = new Date(2026, 3, 11); // Apr 11 local
    expect(maxBirthDateIsoForMinAge(16, ref)).toBe('2010-04-11');
  });

  it('handles year boundary month/day', () => {
    const ref = new Date(2026, 0, 15); // Jan 15
    expect(maxBirthDateIsoForMinAge(16, ref)).toBe('2010-01-15');
  });
});
