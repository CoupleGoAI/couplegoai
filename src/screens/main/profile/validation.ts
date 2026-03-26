const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NAME_LENGTH = 60;
const MIN_AGE_YEARS = 13;

function isValidDate(value: string): boolean {
    const date = new Date(value);
    if (isNaN(date.getTime())) return false;
    // Verify the parsed date matches the input (catches e.g. Feb 30)
    return date.toISOString().startsWith(value);
}

export function validateName(name: string): string | null {
    const trimmed = name.trim();
    if (trimmed.length === 0) return 'Name is required';
    if (trimmed.length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or fewer`;
    return null;
}

export function validateBirthDate(value: string): string | null {
    if (value === '') return null;
    if (!DATE_REGEX.test(value)) return 'Use format YYYY-MM-DD';
    if (!isValidDate(value)) return 'Please enter a valid date';

    const birth = new Date(value);
    const today = new Date();
    const minDate = new Date(
        today.getFullYear() - MIN_AGE_YEARS,
        today.getMonth(),
        today.getDate(),
    );
    if (birth > minDate) return 'You must be at least 13 years old';
    return null;
}

export function validateDatingStartDate(value: string): string | null {
    if (value === '') return null;
    if (!DATE_REGEX.test(value)) return 'Use format YYYY-MM-DD';
    if (!isValidDate(value)) return 'Please enter a valid date';

    const date = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date > today) return 'Date cannot be in the future';
    return null;
}

/** Ensures datingStartDate is strictly after birthDate. Call only when both are non-empty. */
export function validateDatingAfterBirth(datingStart: string, birthDate: string): string | null {
    if (datingStart === '' || birthDate === '') return null;
    const datingDate = new Date(datingStart);
    const birthDateObj = new Date(birthDate);
    if (isNaN(datingDate.getTime()) || isNaN(birthDateObj.getTime())) return null;
    if (datingDate <= birthDateObj) return 'Your anniversary must be after your birth date';
    return null;
}
