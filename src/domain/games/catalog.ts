import type {
  GameType,
  GameCategoryKey,
  GameDefinition,
  WyrPrompt,
  TotPrompt,
  WimlPrompt,
  NhiePrompt,
} from '@/types/games';

// ─── Category Constants ────────────────────────────────────

const ALL_CATEGORIES: readonly GameCategoryKey[] = [
  'mixed',
  'fun',
  'romance',
  'home',
  'adventure',
  'values',
  'spicy',
] as const;

// ─── Would You Rather ──────────────────────────────────────

const WYR_PROMPTS: readonly WyrPrompt[] = [
  // mixed (original + new)
  { id: 'wyr-1', category: 'mixed', optionA: 'Have weekly date nights', optionB: 'Have daily 10-minute check-ins' },
  { id: 'wyr-2', category: 'mixed', optionA: 'Travel somewhere new every year', optionB: 'Build a perfect home together' },
  { id: 'wyr-3', category: 'mixed', optionA: 'Your partner always surprises you', optionB: 'Your partner always plans things with you' },
  { id: 'wyr-4', category: 'mixed', optionA: 'Grow old in a vibrant city', optionB: 'Grow old in a quiet home in nature' },
  { id: 'wyr-5', category: 'mixed', optionA: "Be each other's biggest adventure", optionB: "Be each other's calmest safe place" },

  // fun
  { id: 'wyr-6', category: 'fun', optionA: 'Have big, rare romantic gestures', optionB: 'Have small, daily acts of love' },
  { id: 'wyr-7', category: 'fun', optionA: 'Your partner challenges you to grow', optionB: 'Your partner accepts you exactly as you are' },
  { id: 'wyr-8', category: 'fun', optionA: 'Cook every meal together at home', optionB: 'Try a new restaurant every week' },
  { id: 'wyr-11', category: 'fun', optionA: 'Only communicate in song lyrics for a day', optionB: 'Only communicate in movie quotes for a day' },
  { id: 'wyr-12', category: 'fun', optionA: 'Have a partner who tells the best jokes', optionB: 'Have a partner who laughs at all your jokes' },

  // romance
  { id: 'wyr-9', category: 'romance', optionA: 'Know exactly how your partner feels', optionB: 'Know exactly what your partner needs' },
  { id: 'wyr-10', category: 'romance', optionA: 'Have a tight circle of close couple friends', optionB: 'Have a wide social world of many connections' },
  { id: 'wyr-13', category: 'romance', optionA: 'Receive a handwritten love letter every month', optionB: 'Receive a surprise playlist made for you' },
  { id: 'wyr-14', category: 'romance', optionA: 'Relive your first date forever', optionB: 'Skip ahead to your 50th anniversary' },
  { id: 'wyr-15', category: 'romance', optionA: 'Have your partner write your vows', optionB: 'Write your own vows as a surprise' },

  // home
  { id: 'wyr-16', category: 'home', optionA: 'Have matching pajamas every night', optionB: 'Have matching coffee mugs every morning' },
  { id: 'wyr-17', category: 'home', optionA: 'Design your dream home together', optionB: 'Let your partner surprise you with the design' },
  { id: 'wyr-18', category: 'home', optionA: 'Have a chef cook for you at home', optionB: 'Have a cleaning service so you can cook together' },
  { id: 'wyr-19', category: 'home', optionA: 'Share one big closet', optionB: 'Have totally separate closets' },
  { id: 'wyr-20', category: 'home', optionA: 'Sunday brunch at home every week', optionB: 'Friday movie night at home every week' },

  // adventure
  { id: 'wyr-21', category: 'adventure', optionA: 'Backpack through Europe together', optionB: 'Road trip across your own country' },
  { id: 'wyr-22', category: 'adventure', optionA: 'Learn a new language together', optionB: 'Learn to scuba dive together' },
  { id: 'wyr-23', category: 'adventure', optionA: 'Move to a new city every 2 years', optionB: 'Put down roots in one place forever' },
  { id: 'wyr-24', category: 'adventure', optionA: 'Hike to a mountain summit together', optionB: 'Sail across the ocean together' },
  { id: 'wyr-25', category: 'adventure', optionA: 'Try every cuisine in the world together', optionB: 'Visit every continent together' },

  // values
  { id: 'wyr-26', category: 'values', optionA: 'Always be brutally honest', optionB: 'Sometimes keep small things to yourself' },
  { id: 'wyr-27', category: 'values', optionA: 'Prioritize career growth together', optionB: 'Prioritize free time together' },
  { id: 'wyr-28', category: 'values', optionA: 'Give generously to others as a couple', optionB: 'Save carefully for your future together' },
  { id: 'wyr-29', category: 'values', optionA: 'Have one shared bank account', optionB: 'Keep finances totally separate' },
  { id: 'wyr-30', category: 'values', optionA: 'Spend holidays with family every year', optionB: 'Create your own holiday traditions' },

  // spicy
  { id: 'wyr-31', category: 'spicy', optionA: 'Receive a flirty text every morning', optionB: 'Receive a goodnight voice note every night' },
  { id: 'wyr-32', category: 'spicy', optionA: 'Have a surprise spa day together', optionB: 'Have a surprise candlelit dinner at home' },
  { id: 'wyr-33', category: 'spicy', optionA: 'Your partner gives the best massages', optionB: 'Your partner gives the best compliments' },
  { id: 'wyr-34', category: 'spicy', optionA: 'Slow dance in the living room at midnight', optionB: 'Watch the sunrise together from bed' },
  { id: 'wyr-35', category: 'spicy', optionA: 'A weekend getaway with no phones', optionB: 'A staycation with no responsibilities' },
] as const;

// ─── This or That ──────────────────────────────────────────

const TOT_PROMPTS: readonly TotPrompt[] = [
  // mixed (original + new)
  { id: 'tot-1', category: 'mixed', optionA: 'Morning coffee ☕', optionB: 'Evening tea 🍵' },
  { id: 'tot-2', category: 'mixed', optionA: 'Movie night in 🎬', optionB: 'Night out 🍷' },
  { id: 'tot-3', category: 'mixed', optionA: 'Beach 🏖️', optionB: 'Mountains ⛰️' },
  { id: 'tot-4', category: 'mixed', optionA: 'Cooking together 👨‍🍳', optionB: 'New restaurants 🍜' },
  { id: 'tot-5', category: 'mixed', optionA: 'Surprise plans 🎉', optionB: 'Planned adventures 📅' },

  // fun
  { id: 'tot-6', category: 'fun', optionA: 'Cuddles on the couch 🛋️', optionB: 'Dancing in the kitchen 💃' },
  { id: 'tot-7', category: 'fun', optionA: 'Road trip 🚗', optionB: 'Flight away ✈️' },
  { id: 'tot-8', category: 'fun', optionA: 'Game night with friends 🎲', optionB: 'Cozy night just us 🕯️' },
  { id: 'tot-11', category: 'fun', optionA: 'Karaoke night 🎤', optionB: 'Trivia night 🧠' },
  { id: 'tot-12', category: 'fun', optionA: 'Water park 🌊', optionB: 'Amusement park 🎢' },

  // romance
  { id: 'tot-9', category: 'romance', optionA: 'Love notes 💌', optionB: 'Voice messages 🎙️' },
  { id: 'tot-10', category: 'romance', optionA: 'Spa weekend 🧖', optionB: 'Camping trip ⛺' },
  { id: 'tot-13', category: 'romance', optionA: 'Roses 🌹', optionB: 'Wildflowers 🌸' },
  { id: 'tot-14', category: 'romance', optionA: 'Sunset walks 🌅', optionB: 'Stargazing nights ✨' },
  { id: 'tot-15', category: 'romance', optionA: 'Couples massage 💆', optionB: 'Couples cooking class 👩‍🍳' },

  // home
  { id: 'tot-16', category: 'home', optionA: 'Minimalist space 🤍', optionB: 'Cozy maximalist 🧸' },
  { id: 'tot-17', category: 'home', optionA: 'Cook from scratch 🥘', optionB: 'Order in tonight 📱' },
  { id: 'tot-18', category: 'home', optionA: 'Big bathtub 🛁', optionB: 'Big kitchen 🍳' },
  { id: 'tot-19', category: 'home', optionA: 'Plants everywhere 🪴', optionB: 'Candles everywhere 🕯️' },
  { id: 'tot-20', category: 'home', optionA: 'Shared blanket 🛏️', optionB: 'Separate blankets 🧣' },

  // adventure
  { id: 'tot-21', category: 'adventure', optionA: 'Scuba diving 🤿', optionB: 'Skydiving 🪂' },
  { id: 'tot-22', category: 'adventure', optionA: 'Paris 🇫🇷', optionB: 'Tokyo 🇯🇵' },
  { id: 'tot-23', category: 'adventure', optionA: 'Camping under stars 🏕️', optionB: 'Boutique hotel 🏨' },
  { id: 'tot-24', category: 'adventure', optionA: 'Sunrise hike 🌄', optionB: 'Late-night city walk 🌃' },
  { id: 'tot-25', category: 'adventure', optionA: 'Safari 🦁', optionB: 'Northern lights 🌌' },

  // values
  { id: 'tot-26', category: 'values', optionA: 'Quality time ⏳', optionB: 'Words of affirmation 💬' },
  { id: 'tot-27', category: 'values', optionA: 'Big wedding 💒', optionB: 'Intimate elopement 💍' },
  { id: 'tot-28', category: 'values', optionA: 'Save for the future 🏦', optionB: 'Live for today 🎈' },
  { id: 'tot-29', category: 'values', optionA: 'Forgive quickly 🕊️', optionB: 'Talk it all out first 🗣️' },
  { id: 'tot-30', category: 'values', optionA: 'Tradition 🎄', optionB: 'New experiences 🆕' },

  // spicy
  { id: 'tot-31', category: 'spicy', optionA: 'Morning kisses 😘', optionB: 'Goodnight kisses 💋' },
  { id: 'tot-32', category: 'spicy', optionA: 'Flirty texts 📱', optionB: 'Lingering eye contact 👀' },
  { id: 'tot-33', category: 'spicy', optionA: 'Bubble bath together 🫧', optionB: 'Slow dance at home 🎶' },
  { id: 'tot-34', category: 'spicy', optionA: 'Breakfast in bed 🥞', optionB: 'Midnight snacks together 🍫' },
  { id: 'tot-35', category: 'spicy', optionA: 'Whispered compliments 🤫', optionB: 'Love notes in pockets 💕' },
] as const;

// ─── Who's More Likely To ──────────────────────────────────

const WIML_PROMPTS: readonly WimlPrompt[] = [
  // mixed
  { id: 'wiml-1', category: 'mixed', prompt: 'Forget an anniversary' },
  { id: 'wiml-2', category: 'mixed', prompt: 'Cry during a movie' },
  { id: 'wiml-3', category: 'mixed', prompt: 'Talk to a stranger at a party' },
  { id: 'wiml-4', category: 'mixed', prompt: 'Fall asleep first' },
  { id: 'wiml-5', category: 'mixed', prompt: 'Be the first to say sorry' },

  // fun
  { id: 'wiml-6', category: 'fun', prompt: 'Start a dance party in public' },
  { id: 'wiml-7', category: 'fun', prompt: 'Eat the last slice of pizza' },
  { id: 'wiml-8', category: 'fun', prompt: 'Binge an entire show in one day' },
  { id: 'wiml-9', category: 'fun', prompt: 'Laugh at their own joke' },
  { id: 'wiml-10', category: 'fun', prompt: 'Sing in the shower' },

  // romance
  { id: 'wiml-11', category: 'romance', prompt: 'Plan a surprise date' },
  { id: 'wiml-12', category: 'romance', prompt: 'Write a love poem' },
  { id: 'wiml-13', category: 'romance', prompt: 'Say "I love you" first' },
  { id: 'wiml-14', category: 'romance', prompt: 'Get emotional reading old texts' },
  { id: 'wiml-15', category: 'romance', prompt: 'Recreate your first date' },

  // home
  { id: 'wiml-16', category: 'home', prompt: 'Hog the blankets at night' },
  { id: 'wiml-17', category: 'home', prompt: 'Burn dinner' },
  { id: 'wiml-18', category: 'home', prompt: 'Forget to take out the trash' },
  { id: 'wiml-19', category: 'home', prompt: 'Spend all day in pajamas' },
  { id: 'wiml-20', category: 'home', prompt: 'Redecorate without asking' },

  // adventure
  { id: 'wiml-21', category: 'adventure', prompt: 'Book a spontaneous trip' },
  { id: 'wiml-22', category: 'adventure', prompt: 'Try an extreme sport' },
  { id: 'wiml-23', category: 'adventure', prompt: 'Get lost on purpose' },
  { id: 'wiml-24', category: 'adventure', prompt: 'Suggest moving to another country' },
  { id: 'wiml-25', category: 'adventure', prompt: 'Talk to locals in a foreign language' },

  // values
  { id: 'wiml-26', category: 'values', prompt: 'Give away their last dollar' },
  { id: 'wiml-27', category: 'values', prompt: 'Stand up for a stranger' },
  { id: 'wiml-28', category: 'values', prompt: 'Put family before everything' },
  { id: 'wiml-29', category: 'values', prompt: 'Stay calm in an argument' },
  { id: 'wiml-30', category: 'values', prompt: 'Volunteer on a free weekend' },

  // spicy
  { id: 'wiml-31', category: 'spicy', prompt: 'Send a flirty text at the wrong time' },
  { id: 'wiml-32', category: 'spicy', prompt: 'Initiate a slow dance at home' },
  { id: 'wiml-33', category: 'spicy', prompt: 'Give a surprise back massage' },
  { id: 'wiml-34', category: 'spicy', prompt: 'Whisper something sweet in public' },
  { id: 'wiml-35', category: 'spicy', prompt: 'Plan a romantic getaway' },
] as const;

// ─── Never Have I Ever ─────────────────────────────────────

const NHIE_PROMPTS: readonly NhiePrompt[] = [
  // mixed
  { id: 'nhie-1', category: 'mixed', statement: 'Stalked my partner on social media before we dated' },
  { id: 'nhie-2', category: 'mixed', statement: 'Pretended to like something my partner loves' },
  { id: 'nhie-3', category: 'mixed', statement: 'Rehearsed a conversation in the mirror' },
  { id: 'nhie-4', category: 'mixed', statement: 'Sent a text meant for my partner to someone else' },
  { id: 'nhie-5', category: 'mixed', statement: 'Kept a gift I secretly didn\'t like' },

  // fun
  { id: 'nhie-6', category: 'fun', statement: 'Laughed so hard I cried with my partner' },
  { id: 'nhie-7', category: 'fun', statement: 'Pulled a prank on my partner' },
  { id: 'nhie-8', category: 'fun', statement: 'Eaten my partner\'s leftovers without asking' },
  { id: 'nhie-9', category: 'fun', statement: 'Worn my partner\'s clothes secretly' },
  { id: 'nhie-10', category: 'fun', statement: 'Made up a silly nickname for my partner' },

  // romance
  { id: 'nhie-11', category: 'romance', statement: 'Written a love letter by hand' },
  { id: 'nhie-12', category: 'romance', statement: 'Cried happy tears because of my partner' },
  { id: 'nhie-13', category: 'romance', statement: 'Planned a surprise just to see them smile' },
  { id: 'nhie-14', category: 'romance', statement: 'Saved our very first text conversation' },
  { id: 'nhie-15', category: 'romance', statement: 'Dreamed about our future together' },

  // home
  { id: 'nhie-16', category: 'home', statement: 'Pretended to be asleep to avoid chores' },
  { id: 'nhie-17', category: 'home', statement: 'Rearranged something my partner just organized' },
  { id: 'nhie-18', category: 'home', statement: 'Binge-watched a show without my partner' },
  { id: 'nhie-19', category: 'home', statement: 'Hidden a shopping bag so my partner wouldn\'t see' },
  { id: 'nhie-20', category: 'home', statement: 'Fallen asleep during a show we were watching together' },

  // adventure
  { id: 'nhie-21', category: 'adventure', statement: 'Booked a trip without telling my partner first' },
  { id: 'nhie-22', category: 'adventure', statement: 'Tried food I couldn\'t even pronounce together' },
  { id: 'nhie-23', category: 'adventure', statement: 'Gotten completely lost on a trip with my partner' },
  { id: 'nhie-24', category: 'adventure', statement: 'Said "let\'s just go" and left that same day' },
  { id: 'nhie-25', category: 'adventure', statement: 'Taken a photo in a matching couple outfit on vacation' },

  // values
  { id: 'nhie-26', category: 'values', statement: 'Changed my mind on something because of my partner' },
  { id: 'nhie-27', category: 'values', statement: 'Apologized even when I thought I was right' },
  { id: 'nhie-28', category: 'values', statement: 'Made a big decision without consulting my partner' },
  { id: 'nhie-29', category: 'values', statement: 'Put my partner\'s happiness before my own' },
  { id: 'nhie-30', category: 'values', statement: 'Had a deep 3 AM conversation about life' },

  // spicy
  { id: 'nhie-31', category: 'spicy', statement: 'Sent a flirty text and immediately regretted it' },
  { id: 'nhie-32', category: 'spicy', statement: 'Gotten butterflies just from my partner walking in' },
  { id: 'nhie-33', category: 'spicy', statement: 'Tried to impress my partner with a new outfit' },
  { id: 'nhie-34', category: 'spicy', statement: 'Set the mood with candles and music' },
  { id: 'nhie-35', category: 'spicy', statement: 'Daydreamed about my partner during a meeting' },
] as const;

// ─── Game Definitions ──────────────────────────────────────

export const WOULD_YOU_RATHER_DEF: GameDefinition<WyrPrompt> = {
  type: 'would_you_rather',
  title: 'Would You Rather?',
  shortTitle: 'WYR',
  emoji: '🤔',
  description: 'Pick between two relationship dilemmas',
  defaultRounds: 10,
  supportedCategories: ALL_CATEGORIES,
  prompts: WYR_PROMPTS,
};

export const THIS_OR_THAT_DEF: GameDefinition<TotPrompt> = {
  type: 'this_or_that',
  title: 'This or That',
  shortTitle: 'ToT',
  emoji: '⚡',
  description: 'Quick-fire preference pairs',
  defaultRounds: 10,
  supportedCategories: ALL_CATEGORIES,
  prompts: TOT_PROMPTS,
};

export const WHO_IS_MORE_LIKELY_DEF: GameDefinition<WimlPrompt> = {
  type: 'who_is_more_likely',
  title: "Who's More Likely To?",
  shortTitle: 'WIML',
  emoji: '👀',
  description: 'Pick who would most likely do it',
  defaultRounds: 10,
  supportedCategories: ALL_CATEGORIES,
  prompts: WIML_PROMPTS,
};

export const NEVER_HAVE_I_EVER_DEF: GameDefinition<NhiePrompt> = {
  type: 'never_have_i_ever',
  title: 'Never Have I Ever',
  shortTitle: 'NHIE',
  emoji: '🙈',
  description: 'Confess what you have (or haven\'t) done',
  defaultRounds: 10,
  supportedCategories: ALL_CATEGORIES,
  prompts: NHIE_PROMPTS,
};

export const GAME_DEFINITIONS: Record<GameType, GameDefinition> = {
  would_you_rather: WOULD_YOU_RATHER_DEF,
  this_or_that: THIS_OR_THAT_DEF,
  who_is_more_likely: WHO_IS_MORE_LIKELY_DEF,
  never_have_i_ever: NEVER_HAVE_I_EVER_DEF,
};
