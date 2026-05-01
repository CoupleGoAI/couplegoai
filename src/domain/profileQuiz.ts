// Quiz questions, answer maps, and scoring — pure functions only.

export type LoveStyle =
  | 'words_reassurance'
  | 'time_presence'
  | 'action_support'
  | 'touch_affection'
  | 'thoughtful_gestures';

export type ConflictStyle =
  | 'direct_pursuer'
  | 'peacekeeper_avoider'
  | 'reactive_defender'
  | 'collaborative_repairer';

export type SafetyStyle =
  | 'secure'
  | 'reassurance_seeking'
  | 'guarded_self_protective'
  | 'mixed_push_pull';

export interface QuizResults {
  loveStyle: LoveStyle;
  conflictStyle: ConflictStyle;
  safetyStyle: SafetyStyle;
  loveAnswers: number[];
  conflictAnswers: number[];
  safetyAnswers: number[];
}

// ─── Question data ────────────────────────────────────────────────────────────

export interface BinaryQuestion {
  q: string;
  a: string;
  b: string;
}

export interface MultiQuestion {
  q: string;
  options: [string, string, string, string];
}

export interface ScaleQuestion {
  q: string;
}

export const LOVE_QUESTIONS: BinaryQuestion[] = [
  { q: 'What makes you feel more loved?', a: 'My partner gives me their full attention.', b: 'My partner does something thoughtful to make my day easier.' },
  { q: 'What means more to you after a hard day?', a: 'Hearing comforting and encouraging words.', b: 'Getting a hug or affectionate touch.' },
  { q: 'What feels more special?', a: 'A planned moment together with no distractions.', b: 'A small thoughtful surprise that shows I was on their mind.' },
  { q: 'When you feel stressed, what helps most?', a: 'My partner reminds me verbally that they are there for me.', b: 'My partner steps in and helps without me asking.' },
  { q: 'What makes you feel more appreciated?', a: 'Being told clearly what I mean to them.', b: 'Physical closeness like cuddling, hand-holding, or touch.' },
  { q: 'What feels more romantic to you?', a: 'Deep conversation and quality time together.', b: 'A meaningful gesture or thoughtful act.' },
  { q: 'What matters more on an ordinary weekday?', a: 'My partner checking in and being mentally present with me.', b: 'My partner doing something considerate that lightens my load.' },
  { q: 'What would stay with you longer?', a: 'A sincere compliment or heartfelt message.', b: 'A warm physical moment that makes me feel close.' },
  { q: 'What makes you feel most remembered?', a: 'My partner setting aside real time just for us.', b: 'My partner bringing or doing something thoughtful because it reminded them of me.' },
  { q: 'If your partner wanted to show love today, what would land best?', a: 'Give me focused time and attention.', b: 'Show love through action, touch, or a thoughtful gesture.' },
];

export const CONFLICT_QUESTIONS: MultiQuestion[] = [
  { q: 'When something bothers you in your relationship, what do you usually do first?', options: ['Bring it up quickly so it can be addressed.', 'Wait and hope it passes.', 'Keep it in until it feels too big to ignore.', 'Pull away until I feel calmer.'] },
  { q: 'In a disagreement, what matters most to you?', options: ['Feeling heard and understood.', 'Finding a fair solution.', 'Keeping the peace.', 'Making sure my side is clear.'] },
  { q: 'If you feel misunderstood, how do you usually react?', options: ['I explain myself more strongly.', 'I get quiet and shut down.', 'I become frustrated and reactive.', 'I try to slow the conversation down.'] },
  { q: 'When your partner criticizes you, what are you most likely to do?', options: ['Defend myself right away.', 'Withdraw emotionally.', 'Criticize back.', 'Ask what they really need from me.'] },
  { q: 'During conflict, which sounds most like you?', options: ['I push to solve it immediately.', 'I need space before I can talk well.', 'I avoid conflict because it drains me.', 'I try to repair things even if we disagree.'] },
  { q: 'When a conversation gets heated, what do you tend to do?', options: ['Raise my energy and argue harder.', 'Go silent or emotionally leave the conversation.', 'Try to calm things down and reset.', 'Change the subject or stop engaging.'] },
  { q: 'After an argument, what helps you reconnect fastest?', options: ['Talking through what happened clearly.', 'Hearing reassurance and care.', 'Getting some space first.', 'A small repair moment like humor, kindness, or touch.'] },
  { q: 'If your partner says "Can we start over?" during conflict, how do you usually respond?', options: ['I soften quickly and try again.', 'I want to, but I still feel activated.', "I'm skeptical and need more proof.", 'I need time before I can reconnect.'] },
  { q: 'What best describes your conflict style?', options: ['I confront issues directly.', 'I avoid issues until they build up.', 'I become emotional and reactive.', 'I try to solve things collaboratively.'] },
  { q: 'What usually creates the biggest problem in conflict for you?', options: ['Feeling unheard.', 'Feeling blamed.', 'Feeling overwhelmed.', 'Feeling like nothing changes.'] },
];

export const SAFETY_QUESTIONS: ScaleQuestion[] = [
  { q: 'I feel safe being emotionally open with my partner.' },
  { q: 'When I sense distance in my relationship, I start to worry something is wrong.' },
  { q: 'I find it easy to ask for comfort when I need it.' },
  { q: 'When I feel hurt, I tend to pull back instead of reaching out.' },
  { q: 'I need reassurance to feel secure in my relationship.' },
  { q: 'I feel confident that my partner cares about my feelings, even when we are apart.' },
  { q: 'Getting very emotionally close can feel uncomfortable or risky to me.' },
  { q: 'When my partner is upset with me, I worry about losing connection.' },
  { q: 'I can depend on my partner without feeling weak or overly needy.' },
  { q: 'When I feel overwhelmed, I push people away even if I want closeness.' },
  { q: 'I often think more about relationship problems than my partner does.' },
  { q: 'I trust that we can reconnect after a hard moment.' },
];

export const SCALE_LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'] as const;

// ─── Scoring ──────────────────────────────────────────────────────────────────

// A=0, B=1 → love style bucket
const LOVE_MAP: [LoveStyle, LoveStyle][] = [
  ['time_presence',      'action_support'],       // Q1
  ['words_reassurance',  'touch_affection'],       // Q2
  ['time_presence',      'thoughtful_gestures'],   // Q3
  ['words_reassurance',  'action_support'],        // Q4
  ['words_reassurance',  'touch_affection'],       // Q5
  ['time_presence',      'thoughtful_gestures'],   // Q6
  ['words_reassurance',  'action_support'],        // Q7
  ['words_reassurance',  'touch_affection'],       // Q8
  ['time_presence',      'thoughtful_gestures'],   // Q9
  ['time_presence',      'touch_affection'],       // Q10
];

// A=0, B=1, C=2, D=3 → conflict style bucket
const CONFLICT_MAP: [ConflictStyle, ConflictStyle, ConflictStyle, ConflictStyle][] = [
  ['direct_pursuer',         'peacekeeper_avoider',   'peacekeeper_avoider',   'peacekeeper_avoider'],   // Q1
  ['collaborative_repairer', 'collaborative_repairer','peacekeeper_avoider',   'reactive_defender'],     // Q2
  ['reactive_defender',      'peacekeeper_avoider',   'reactive_defender',     'collaborative_repairer'],// Q3
  ['reactive_defender',      'peacekeeper_avoider',   'reactive_defender',     'collaborative_repairer'],// Q4
  ['direct_pursuer',         'peacekeeper_avoider',   'peacekeeper_avoider',   'collaborative_repairer'],// Q5
  ['reactive_defender',      'peacekeeper_avoider',   'collaborative_repairer','peacekeeper_avoider'],   // Q6
  ['direct_pursuer',         'collaborative_repairer','peacekeeper_avoider',   'collaborative_repairer'],// Q7
  ['collaborative_repairer', 'reactive_defender',     'reactive_defender',     'peacekeeper_avoider'],   // Q8
  ['direct_pursuer',         'peacekeeper_avoider',   'reactive_defender',     'collaborative_repairer'],// Q9
  ['collaborative_repairer', 'reactive_defender',     'reactive_defender',     'peacekeeper_avoider'],   // Q10
];

// Safety: question indices (0-based) that indicate each dimension
// Answers are 1-5 (stored as 0-4, +1 when scoring)
const SECURE_IDX   = [0, 2, 5, 8, 11];  // high = secure
const ANXIOUS_IDX  = [1, 4, 7, 10];     // high = anxious
const AVOIDANT_IDX = [3, 6, 9];         // high = avoidant

function avg(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function topKey<T extends string>(counts: Record<T, number>): T {
  return (Object.entries(counts) as [T, number][])
    .reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
}

export function scoreLove(answers: number[]): LoveStyle {
  const counts: Record<LoveStyle, number> = {
    words_reassurance: 0, time_presence: 0, action_support: 0,
    touch_affection: 0, thoughtful_gestures: 0,
  };
  answers.forEach((ans, i) => { counts[LOVE_MAP[i][ans as 0 | 1]]++; });
  return topKey(counts);
}

export function scoreConflict(answers: number[]): ConflictStyle {
  const counts: Record<ConflictStyle, number> = {
    direct_pursuer: 0, peacekeeper_avoider: 0,
    reactive_defender: 0, collaborative_repairer: 0,
  };
  answers.forEach((ans, i) => { counts[CONFLICT_MAP[i][ans as 0|1|2|3]]++; });
  return topKey(counts);
}

export function scoreSafety(answers: number[]): SafetyStyle {
  // answers are 0-4, convert to 1-5
  const vals = answers.map((a) => a + 1);
  const secureAvg   = avg(SECURE_IDX.map((i) => vals[i]));
  const anxiousAvg  = avg(ANXIOUS_IDX.map((i) => vals[i]));
  const avoidantAvg = avg(AVOIDANT_IDX.map((i) => vals[i]));

  if (secureAvg >= 3.5 && anxiousAvg < 3 && avoidantAvg < 3) return 'secure';
  if (anxiousAvg >= avoidantAvg && anxiousAvg >= (6 - secureAvg)) return 'reassurance_seeking';
  if (avoidantAvg > anxiousAvg && avoidantAvg >= (6 - secureAvg)) return 'guarded_self_protective';
  return 'mixed_push_pull';
}

// ─── Display labels ───────────────────────────────────────────────────────────

export const LOVE_STYLE_LABEL: Record<LoveStyle, string> = {
  words_reassurance:  'Words & Reassurance',
  time_presence:      'Time & Presence',
  action_support:     'Action & Support',
  touch_affection:    'Touch & Affection',
  thoughtful_gestures:'Thoughtful Gestures',
};

export const CONFLICT_STYLE_LABEL: Record<ConflictStyle, string> = {
  direct_pursuer:         'Direct Pursuer',
  peacekeeper_avoider:    'Peacekeeper',
  reactive_defender:      'Reactive Defender',
  collaborative_repairer: 'Collaborative Repairer',
};

export const SAFETY_STYLE_LABEL: Record<SafetyStyle, string> = {
  secure:                  'Secure',
  reassurance_seeking:     'Reassurance-Seeking',
  guarded_self_protective: 'Guarded',
  mixed_push_pull:         'Mixed',
};

// For AI prompt injection — plain English descriptions
export function formatQuizProfileForAI(results: QuizResults): string {
  return [
    '',
    'RELATIONSHIP PROFILE (Partner A — self-reported)',
    `Love style: ${LOVE_STYLE_LABEL[results.loveStyle]}`,
    `Conflict style: ${CONFLICT_STYLE_LABEL[results.conflictStyle]}`,
    `Emotional safety: ${SAFETY_STYLE_LABEL[results.safetyStyle]}`,
    'Use these patterns to personalize tone and suggestions. Never name these labels explicitly to the user.',
  ].join('\n');
}
