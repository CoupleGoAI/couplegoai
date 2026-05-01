import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '@components/ui/GradientButton';
import { saveQuizResults } from '@data/profileQuizApi';
import { useAuthStore } from '@store/authStore';
import { fetchProfile } from '@data/auth';
import {
  LOVE_QUESTIONS,
  CONFLICT_QUESTIONS,
  SAFETY_QUESTIONS,
  SCALE_LABELS,
  scoreLove,
  scoreConflict,
  scoreSafety,
  LOVE_STYLE_LABEL,
  CONFLICT_STYLE_LABEL,
  SAFETY_STYLE_LABEL,
} from '@domain/profileQuiz';
import { colors, gradients, fontFamilies, radii, spacing, layout, letterSpacing, fontWeight } from '@/theme/tokens';
import type { RelationshipQuizScreenProps } from '@navigation/types';

// ─── Section metadata ─────────────────────────────────────────────────────────

const SECTIONS = [
  { key: 'love',     title: 'How You Feel Loved',          emoji: '💕', subtitle: 'Choose the option that resonates most.' },
  { key: 'conflict', title: 'How You Handle Conflict',      emoji: '🔥', subtitle: 'Pick the answer that sounds most like you.' },
  { key: 'safety',   title: 'How You Build Emotional Safety', emoji: '🛡️', subtitle: 'Rate how often each statement feels true.' },
] as const;

type SectionKey = typeof SECTIONS[number]['key'];

const TOTAL_QUESTIONS = LOVE_QUESTIONS.length + CONFLICT_QUESTIONS.length + SAFETY_QUESTIONS.length;

// ─── Component ────────────────────────────────────────────────────────────────

export function RelationshipQuizScreen(_props: RelationshipQuizScreenProps): React.ReactElement {
  const [sectionIndex, setSectionIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [showSectionIntro, setShowSectionIntro] = useState(true);
  const [loveAnswers, setLoveAnswers] = useState<number[]>([]);
  const [conflictAnswers, setConflictAnswers] = useState<number[]>([]);
  const [safetyAnswers, setSafetyAnswers] = useState<number[]>([]);
  const [pendingAnswer, setPendingAnswer] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalAnswers, setFinalAnswers] = useState<number[] | null>(null);
  const setUser = useAuthStore((s) => s.setUser);
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const section = SECTIONS[sectionIndex];
  const answeredSoFar = loveAnswers.length + conflictAnswers.length + safetyAnswers.length;
  const progress = answeredSoFar / TOTAL_QUESTIONS;

  // ── Answer handling ────────────────────────────────────────────────────────

  const advanceQuestion = useCallback((answer: number) => {
    const currentKey = SECTIONS[sectionIndex].key;

    if (currentKey === 'love') {
      const next = [...loveAnswers, answer];
      setLoveAnswers(next);
      if (questionIndex + 1 < LOVE_QUESTIONS.length) {
        setQuestionIndex((q) => q + 1);
      } else {
        setSectionIndex(1);
        setQuestionIndex(0);
        setShowSectionIntro(true);
      }
    } else if (currentKey === 'conflict') {
      const next = [...conflictAnswers, answer];
      setConflictAnswers(next);
      if (questionIndex + 1 < CONFLICT_QUESTIONS.length) {
        setQuestionIndex((q) => q + 1);
      } else {
        setSectionIndex(2);
        setQuestionIndex(0);
        setShowSectionIntro(true);
      }
    } else {
      const next = [...safetyAnswers, answer];
      setSafetyAnswers(next);
      if (questionIndex + 1 < SAFETY_QUESTIONS.length) {
        setQuestionIndex((q) => q + 1);
      } else {
        void finish(next);
      }
    }
    setPendingAnswer(null);
  }, [sectionIndex, questionIndex, loveAnswers, conflictAnswers, safetyAnswers]);

  const handleOptionTap = useCallback((idx: number) => {
    const currentKey = SECTIONS[sectionIndex].key;
    // Binary and scale auto-advance; multi-choice requires pending + Next
    if (currentKey === 'love' || currentKey === 'safety') {
      advanceQuestion(idx);
    } else {
      setPendingAnswer(idx);
    }
  }, [sectionIndex, advanceQuestion]);

  const handleNext = useCallback(() => {
    if (pendingAnswer !== null) advanceQuestion(pendingAnswer);
  }, [pendingAnswer, advanceQuestion]);

  const finish = useCallback(async (finalSafetyAnswers: number[]) => {
    // Set finalAnswers first — this gates the blueprint screen so it can never
    // revert to the quiz view regardless of the async save outcome.
    setFinalAnswers(finalSafetyAnswers);
    setSaving(true);
    setError(null);
    try {
      const results = {
        loveStyle:       scoreLove(loveAnswers),
        conflictStyle:   scoreConflict(conflictAnswers),
        safetyStyle:     scoreSafety(finalSafetyAnswers),
        loveAnswers,
        conflictAnswers,
        safetyAnswers:   finalSafetyAnswers,
      };
      await saveQuizResults(results);
      // Refresh auth store so the navigator gate lifts
      if (userId) {
        const profileResult = await fetchProfile(userId);
        if (profileResult.ok) setUser(profileResult.data);
      }
    } catch {
      // Keep blueprint screen visible (finalAnswers stays set); just show error + retry.
      setSaving(false);
      setError('Something went wrong. Please try again.');
    }
  }, [loveAnswers, conflictAnswers, userId, setUser]);

  // ── Section intro splash ───────────────────────────────────────────────────

  if (showSectionIntro) {
    return (
      <LinearGradient colors={gradients.heroWash} style={styles.flex}>
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <View style={styles.introContainer}>
            <Text style={styles.introEmoji}>{section.emoji}</Text>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
            {sectionIndex === 0 && (
              <Text style={styles.introHint}>
                Before you meet your AI Relationship Assistant, answer 3 short quizzes so we can understand how you connect, handle tension, and feel loved.
              </Text>
            )}
            <GradientButton
              label="Let's go"
              onPress={() => setShowSectionIntro(false)}
              size="lg"
              fullWidth
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Saving / result splash ─────────────────────────────────────────────────
  // Gated on finalAnswers (not `saving`) so the blueprint can never bounce back
  // to the quiz view if the async save fails and setSaving(false) fires.

  if (finalAnswers !== null) {
    const loveStyle     = scoreLove(loveAnswers);
    const conflictStyle = scoreConflict(conflictAnswers);
    const safetyStyle   = scoreSafety(finalAnswers);

    return (
      <LinearGradient colors={gradients.heroWash} style={styles.flex}>
        <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
          <View style={styles.introContainer}>
            <Text style={styles.introEmoji}>✨</Text>
            <Text style={styles.sectionTitle}>Your Connection Blueprint</Text>
            <View style={styles.resultCard}>
              <ResultRow label="How you feel loved" value={LOVE_STYLE_LABEL[loveStyle]} />
              <ResultRow label="How you handle conflict" value={CONFLICT_STYLE_LABEL[conflictStyle]} />
              <ResultRow label="Emotional safety" value={SAFETY_STYLE_LABEL[safetyStyle]} />
            </View>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <ActivityIndicator color={colors.primary} size="large" />
            )}
            {error ? (
              <GradientButton label="Try again" onPress={() => { void finish(finalAnswers); }} size="lg" fullWidth />
            ) : null}
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Quiz question ──────────────────────────────────────────────────────────

  const currentKey = section.key as SectionKey;
  const questionText = currentKey === 'love'
    ? LOVE_QUESTIONS[questionIndex].q
    : currentKey === 'conflict'
      ? CONFLICT_QUESTIONS[questionIndex].q
      : SAFETY_QUESTIONS[questionIndex].q;

  const sectionTotal = currentKey === 'love'
    ? LOVE_QUESTIONS.length
    : currentKey === 'conflict'
      ? CONFLICT_QUESTIONS.length
      : SAFETY_QUESTIONS.length;

  return (
    <LinearGradient colors={gradients.heroWash} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>{section.emoji} {section.title}</Text>
          <Text style={styles.questionCounter}>{questionIndex + 1} / {sectionTotal}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Question */}
          <Text style={styles.questionText}>{questionText}</Text>

          {/* Options */}
          {currentKey === 'love' && (
            <View style={styles.optionsCol}>
              {[LOVE_QUESTIONS[questionIndex].a, LOVE_QUESTIONS[questionIndex].b].map((opt, i) => (
                <OptionCard
                  key={i}
                  label={opt}
                  selected={pendingAnswer === i}
                  onPress={() => handleOptionTap(i)}
                />
              ))}
            </View>
          )}

          {currentKey === 'conflict' && (
            <View style={styles.optionsCol}>
              {CONFLICT_QUESTIONS[questionIndex].options.map((opt, i) => (
                <OptionCard
                  key={i}
                  label={opt}
                  selected={pendingAnswer === i}
                  onPress={() => handleOptionTap(i)}
                />
              ))}
              {pendingAnswer !== null && (
                <GradientButton label="Next →" onPress={handleNext} size="md" fullWidth />
              )}
            </View>
          )}

          {currentKey === 'safety' && (
            <View style={styles.scaleContainer}>
              <View style={styles.scaleRow}>
                {SCALE_LABELS.map((label, i) => (
                  <ScaleButton
                    key={i}
                    label={label}
                    index={i}
                    selected={pendingAnswer === i}
                    onPress={() => handleOptionTap(i)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OptionCard({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.optionCard, selected && styles.optionCardSelected]}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ScaleButton({ label, index, selected, onPress }: {
  label: string; index: number; selected: boolean; onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[styles.scaleButton, selected && styles.scaleButtonSelected]}
    >
      <Text style={[styles.scaleIndex, selected && styles.scaleIndexSelected]}>{index + 1}</Text>
      <Text style={[styles.scaleLabel, selected && styles.scaleLabelSelected]} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },

  progressTrack: {
    height: 3,
    backgroundColor: colors.borderLight,
    marginHorizontal: 0,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeight.medium,
    color: colors.foregroundMuted,
    letterSpacing: letterSpacing.wide,
  },
  questionCounter: {
    fontSize: 13,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeight.medium,
    color: colors.gray,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },

  questionText: {
    fontSize: 20,
    fontFamily: fontFamilies.serifBold,
    color: colors.foreground,
    marginVertical: spacing.xl,
    lineHeight: 28,
    letterSpacing: letterSpacing.tight,
  },

  optionsCol: {
    gap: spacing.sm,
  },
  optionCard: {
    backgroundColor: colors.background,
    borderRadius: radii.radius,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    padding: layout.cardPadding,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.muted,
  },
  optionText: {
    fontSize: 15,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeight.regular,
    color: colors.foreground,
    lineHeight: 22,
  },
  optionTextSelected: {
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },

  scaleContainer: {
    marginTop: spacing.md,
  },
  scaleRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  scaleButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.radiusSm,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
    gap: 4,
  },
  scaleButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.muted,
  },
  scaleIndex: {
    fontSize: 18,
    fontFamily: fontFamilies.sansBold,
    color: colors.foregroundMuted,
  },
  scaleIndexSelected: {
    color: colors.primary,
  },
  scaleLabel: {
    fontSize: 10,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeight.regular,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 13,
  },
  scaleLabelSelected: {
    color: colors.foregroundMuted,
    fontWeight: fontWeight.medium,
  },

  // Section intro
  introContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  introEmoji: {
    fontSize: 64,
  },
  sectionTitle: {
    fontSize: 26,
    fontFamily: fontFamilies.serifBold,
    color: colors.foreground,
    textAlign: 'center',
    letterSpacing: letterSpacing.tight,
  },
  sectionSubtitle: {
    fontSize: 15,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeight.regular,
    color: colors.foregroundMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  introHint: {
    fontSize: 13,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeight.regular,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },

  // Result card
  resultCard: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: radii.radius,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    overflow: 'hidden',
  },
  resultRow: {
    paddingHorizontal: layout.cardPadding,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  resultLabel: {
    fontSize: 12,
    fontFamily: fontFamilies.sans,
    fontWeight: fontWeight.medium,
    color: colors.gray,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.wide,
  },
  resultValue: {
    fontSize: 16,
    fontFamily: fontFamilies.sansBold,
    color: colors.foreground,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    fontFamily: fontFamilies.sans,
  },
});
