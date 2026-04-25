// Role-label ↔ display-name substitution.
//
// The AI backend only ever sees and emits role labels ("Partner A" /
// "Partner B"). Real display names never leave the device for the LLM
// layer. For UX warmth we splice the display names back into the assistant
// text on the client, after the stream arrives.
//
// The LLM is instructed never to use these labels in its replies. This
// utility is a safety net for the cases where it slips up.

export interface PartnerLabelNames {
    partnerA: string | null;
    partnerB?: string | null;
}

// Match "Partner A" / "Partner B" as whole words, case-insensitive, with
// optional possessive ("Partner A's"). We deliberately do NOT match inside
// other words (e.g. "partnership").
const PARTNER_A_RE = /\bPartner\s+A\b/gi;
const PARTNER_B_RE = /\bPartner\s+B\b/gi;

export function substitutePartnerLabels(
    text: string,
    names: PartnerLabelNames,
): string {
    if (!text) return text;
    let out = text;
    const a = names.partnerA?.trim();
    const b = names.partnerB?.trim();
    if (a) out = out.replace(PARTNER_A_RE, a);
    if (b) out = out.replace(PARTNER_B_RE, b);
    return out;
}
