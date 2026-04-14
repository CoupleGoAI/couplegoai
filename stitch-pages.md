# CoupleGoAI — Page Reference for Redesign

Premium Gen Z couples app. Tone: warm, romantic, modern, slightly playful — never childish.

## Brand

- Primary: #f48ba6 (pink), Accent: #cc7be8 (lavender)
- Background: #ffffff, Text: #1e1230, Muted text: #42335a, Gray: #8a7b9e
- Soft surfaces: #fef0f4 (pink tint), #f5eafa (lavender tint)
- Gradients: pink-to-lavender for CTAs, soft pink wash for backgrounds
- Radii: 20px default, 16px medium, 12px small, 999px for pills
- Font: sans-serif primary, serif bold for display headings
- Pill-shaped CTAs with gradient fill. Card-based layouts with subtle shadows.

## Navigation

Bottom tab bar with 5 tabs: Home (Nest), Games (Play), AI Chat (center floating heart button), Us (Insights), Profile. Chat tab opens as full-screen modal, not a tab screen.

---

## 1. Splash Screen

Full-screen gradient background (pink-to-lavender). Centered breathing logo that scales up/down with a soft glow behind it. App name "CoupleGoAI" in serif bold below. Three loading dots at bottom with staggered opacity animation. No interactive elements.

## 2. Login Screen

Gradient wash background. Centered layout. Top: heart emoji (52px), "Welcome back" display heading, "Log in to continue your couple journey" subtitle. Two input fields with icon prefix (mail, lock) — white background, rounded, subtle shadow, pink border on focus. Password has show/hide toggle. Error banner (red bg, alert icon) appears below fields. Full-width gradient "Log In" CTA button. "Don't have an account? Sign up" link at bottom.

## 3. Register Screen

Same layout as Login. Back chevron top-left. Sparkle emoji, "Create account" heading, "Start your couple journey together" subtitle. Three fields: email, password, confirm password — all with icon prefix and show/hide toggles. Full-width gradient "Create Account" CTA. "Already have an account? Log in" link.

## 4. Onboarding Profile (Chat-based)

Three states:

**Loading**: Gradient wash, heart emoji, spinner, "Getting things ready..." text.

**Chat**: Full chat interface. AI assistant asks questions conversationally to build user profile (name, birthday, preferences). Messages appear as bubbles. Interactive date picker appears inline as a special card. Input bar at bottom with send button. Title bar shows "CoupleGoAI" with heart emoji.

**Completion**: Gradient wash, large party emoji (64px), serif "You're all set!" heading, "Your profile is ready. Let's connect with your partner." subtitle. Full-width gradient "Let's Go!" CTA.

## 5. Generate QR Screen

White background. Header: "Connect with your partner" display heading, "Ask your partner to scan this QR code" subtitle. Center: QR code (220px) inside a card with shadow. Below QR: countdown timer "Expires in X:XX", "Alternative code" label with 6-char alphanumeric code. Expired state: clock emoji, "Code expired" heading, "Generate new code" CTA. Footer: "Want to scan instead?" with pink "Scan partner's QR" link, and "Skip for now" underlined link.

## 6. Scan QR Screen

White background. Back button top-left. Header text. Camera viewfinder takes most of the screen with a rounded container and pink-tinted frame overlay. Below camera: "OR enter alternative code" with text input (6 chars, uppercase) and heart-shaped submit button. Status area shows "Scanning..." or error with retry. Footer: "Want to generate instead?" toggle link, "Skip for now" link.

## 7. Connection Confirmed Screen

Gradient wash. Centered layout. Large couple emoji (80px). "You're connected!" display heading. Personalized subtitle with partner name. White partner card with shadow showing partner name. Full-width gradient "Set up your couple profile" CTA.

## 8. Couple Setup (Chat-based)

Same three-state structure as Onboarding Profile. AI conversationally gathers couple-specific info (dating start date, help focus areas). Includes selectable chip options for help type. Interactive date picker for dating anniversary. Completion screen says "You're ready!" with "Your couple profile is all set. Let's start growing together."

## 9. Home Screen (Main Tab)

Gradient wash. Scrollable. Top: time-based greeting label ("Good morning") in small caps gray, user first name in display font with fade-in animation.

**Coupled state**: White couple card with shadow — two avatar circles (56px) with names below, heart icon in gradient circle between them. "Together since [date]" below.

**Uncoupled state**: Pink pill banner "Pair with your partner" with heart icon, chevron arrow.

Bottom: four quick-link cards in a row (Chat, Games, Us, Profile) — each has a colored icon in a tinted circle, label below. White cards with light border and shadow.

## 10. Games Screen (Tab)

Gradient wash. "Play Together" heading, "Games that bring you closer" subheading. Active session banner (green tint, green dot, "Game in progress", "Resume" pill). Pending invite banner (elevated surface, hourglass emoji, "Invite sent! Waiting for your partner to accept...", "Cancel" pill). Horizontal scrolling category pills (Mixed, Fun, Romance, Home, Adventure, Values, Spicy) with emoji + label, pink border when active. Game cards: white with shadow, each has emoji in bordered circle, title, description, round count, colored "Play" chip. Four games: Would You Rather, This or That, Who Is More Likely, Never Have I Ever.

## 11. Game Lobby Screen

White background. Back button. Hero section: large emoji circle (80px) with game emoji, game title, description. "CATEGORY" section label with horizontal pill selector. Details card with round count, player info, real-time sync indicators. Error banner if present. Waiting state: elevated card with pulsing dot, "Waiting for partner...", cancel button. Bottom: full-width gradient "Invite partner to play" CTA.

## 12. Game Session Screen

Full-screen game interface. Shows current round prompt (question text). Two answer options as tappable cards. Progress indicator for rounds completed. Waiting state when one player has answered but partner hasn't. Real-time sync of answers. Animated transitions between rounds.

## 13. Game Results Screen

Gradient accents. Match percentage hero display. Round-by-round breakdown showing both players' answers with match/mismatch indicators. Animated score reveal. "Play Again" and navigation CTAs at bottom.

## 14. AI Chat Screen (Modal)

Full chat interface. Mode toggle (single/couple) if user is coupled. Message bubbles with user/assistant styling. Streaming response indicator. Input bar with send functionality. Back navigation. Loading state with gradient background and spinner.

## 15. Us Screen (Insights Tab)

Gradient wash. "Insights" small-caps label, "Us" display heading. Pull-to-refresh. 

Content grid:
- Progress ring hero card (milestone tracking)
- Two-column row: streak card (fire animation), days together card
- Two-column row: games played stat tile, messages exchanged stat tile
- Two-column row: compatibility % tile, match rate % tile
- Category breakdown visualization
- Badges grid
- Insight tip card

Error states: sparkle icon, contextual message, retry button. Skeleton loading placeholders.

## 16. Profile Screen

Gradient wash. Back button header row. Animated avatar circle (spring scale-in) with camera upload overlay. Form sections with staggered fade-in: Name text input, Birth Date picker, Help Focus chips (selectable tags), Dating Start Date picker (only when coupled). Error banner. Full-width gradient "Save changes" CTA. "Disconnect from partner" destructive text link (only when coupled).

## 17. Disconnect Confirm Screen

Gradient wash. Centered: broken-heart icon (56px), "Disconnect?" display heading, explanation text. Animated progress bar (fills over 10 seconds). Countdown text "Available in Xs" → "Ready to confirm". Two actions: outline "Cancel" button and red-bordered "Confirm disconnect" button (disabled during countdown).

## 18. Activities/Moments Screen (Placeholder)

White background. Centered: camera emoji (48px), "Moments" heading, "Your memories coming soon" subtitle. Placeholder for future feature.
