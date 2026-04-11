import { THERAPY_SYSTEM_PROMPT } from '@domain/wellbeing/therapySystemPrompt';

describe('THERAPY_SYSTEM_PROMPT', () => {
    it('states it is not a therapist and mentions crisis routing', () => {
        expect(THERAPY_SYSTEM_PROMPT).toContain('NOT a therapist');
        expect(THERAPY_SYSTEM_PROMPT.toLowerCase()).toContain('crisis');
    });
});
