import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGameInvite } from '@hooks/useGameInvite';
import { useHaptics } from '@hooks/useHaptics';
import { useGamesStore } from '@store/gamesStore';
import { GAME_DEFINITIONS } from '@/domain/games/catalog';
import type { GameLobbyScreenProps, RootNavProp } from '@navigation/types';
import type { GameType, GameCategoryKey } from '@/types/games';
import {
  colors, gradients, radii, spacing, shadows,
  fontFamilies, fontSize, fontWeight, letterSpacing,
} from '@/theme/tokens';

const CATEGORIES: { key: GameCategoryKey; label: string; emoji: string }[] = [
  { key: 'mixed', label: 'Mixed', emoji: '🎲' },
  { key: 'fun', label: 'Fun', emoji: '😄' },
  { key: 'romance', label: 'Romance', emoji: '💕' },
  { key: 'home', label: 'Home', emoji: '🏠' },
  { key: 'adventure', label: 'Adventure', emoji: '🌎' },
  { key: 'values', label: 'Values', emoji: '💎' },
  { key: 'spicy', label: 'Spicy', emoji: '🌶️' },
];

export default function GameLobbyScreen(): React.ReactElement {
  const navigation = useNavigation<RootNavProp>();
  const route = useRoute<GameLobbyScreenProps['route']>();
  const haptics = useHaptics();
  const { sendInvite, outgoingInvite, cancelInvite, isLoading, error } = useGameInvite();

  const gameType = (route.params?.gameType ?? 'would_you_rather') as GameType;
  const [category, setCategory] = useState<GameCategoryKey>(
    (route.params?.categoryKey as GameCategoryKey) ?? 'mixed',
  );

  const gameDef = GAME_DEFINITIONS[gameType];
  const waitingDot = useSharedValue(0.4);

  React.useEffect(() => {
    if (outgoingInvite) {
      waitingDot.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
    }
  }, [outgoingInvite, waitingDot]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: waitingDot.value,
  }));

  const handleSendInvite = useCallback(async () => {
    void haptics.medium();
    await sendInvite(gameType, category);
  }, [haptics, sendInvite, gameType, category]);

  const handleCancel = useCallback(async () => {
    if (!outgoingInvite) return;
    void haptics.light();
    await cancelInvite(outgoingInvite.id);
  }, [haptics, cancelInvite, outgoingInvite]);

  const handleCategorySelect = useCallback((key: GameCategoryKey) => {
    void haptics.light();
    setCategory(key);
  }, [haptics]);

  // Listen for session creation from invite acceptance
  const activeSessionId = useGamesStore((s) => s.activeSessionId);
  React.useEffect(() => {
    if (activeSessionId) {
      navigation.replace('GameSession', { sessionId: activeSessionId });
    }
  }, [activeSessionId, navigation]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Game Hero */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.hero}>
          <View style={styles.emojiCircle}>
            <Text style={styles.heroEmoji}>{gameDef?.emoji ?? '🎮'}</Text>
          </View>
          <Text style={styles.heroTitle}>{gameDef?.title ?? 'Game'}</Text>
          <Text style={styles.heroDesc}>{gameDef?.description ?? ''}</Text>
        </Animated.View>

        {/* Category Selector */}
        <Animated.View entering={FadeInDown.delay(140).duration(400)}>
          <Text style={styles.sectionLabel}>CATEGORY</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryPill,
                  category === cat.key && styles.categoryPillActive,
                ]}
                onPress={() => handleCategorySelect(cat.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[
                  styles.categoryLabel,
                  category === cat.key && styles.categoryLabelActive,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Game Details */}
        <Animated.View entering={FadeInDown.delay(220).duration(400)} style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>⏱</Text>
            <Text style={styles.detailText}>{gameDef?.defaultRounds ?? 10} rounds</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👥</Text>
            <Text style={styles.detailText}>You & your partner</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🔄</Text>
            <Text style={styles.detailText}>Real-time sync</Text>
          </View>
        </Animated.View>

        {/* Error */}
        {error ? (
          <Animated.View entering={FadeInUp.duration(200)} style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        ) : null}

        {/* Waiting State */}
        {outgoingInvite ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.waitingCard}>
            <Animated.View style={[styles.waitingDot, dotStyle]} />
            <Text style={styles.waitingTitle}>Waiting for partner…</Text>
            <Text style={styles.waitingSubtitle}>
              They'll see the invite in their app
            </Text>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelLabel}>Cancel invite</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* CTA */}
      {!outgoingInvite ? (
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.ctaWrap}>
          <TouchableOpacity
            onPress={handleSendInvite}
            disabled={isLoading}
            activeOpacity={0.85}
            style={styles.ctaBtn}
          >
            <LinearGradient
              colors={isLoading ? gradients.disabled : gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaLabel}>
                {isLoading ? 'Sending…' : 'Invite partner to play'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backBtn: { paddingVertical: spacing.xs },
  backText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.base,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  emojiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceGame,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  heroEmoji: { fontSize: 36 },
  heroTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    textAlign: 'center',
  },
  heroDesc: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.base,
    color: colors.foregroundMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  sectionLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.gray,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  categoryRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.radiusFull,
    backgroundColor: colors.surfaceGame,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  categoryPillActive: {
    backgroundColor: colors.muted,
    borderColor: colors.primary,
  },
  categoryEmoji: { fontSize: 14 },
  categoryLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.foregroundMuted,
  },
  categoryLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  detailsCard: {
    backgroundColor: colors.surfaceGame,
    borderRadius: radii.radiusMd,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  detailIcon: { fontSize: 18 },
  detailText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  errorBanner: {
    backgroundColor: colors.errorBg,
    borderRadius: radii.radiusSm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: 'center',
  },
  waitingCard: {
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.radius,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    ...shadows.sm,
  },
  waitingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  waitingTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  waitingSubtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.sm,
    color: colors.foregroundMuted,
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.radiusFull,
    backgroundColor: colors.muted,
    marginTop: spacing.sm,
  },
  cancelLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.foregroundMuted,
  },
  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
  },
  ctaBtn: { alignSelf: 'stretch' },
  ctaGradient: {
    borderRadius: radii.radiusFull,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.glowPrimary,
  },
  ctaLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    letterSpacing: letterSpacing.subtle,
  },
});
