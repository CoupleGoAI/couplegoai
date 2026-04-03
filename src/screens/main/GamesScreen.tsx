import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useHaptics } from '@hooks/useHaptics';
import { useGameInvite } from '@hooks/useGameInvite';
import { useGamesStore } from '@store/gamesStore';
import { GAME_DEFINITIONS } from '@/domain/games/catalog';
import type { PlayScreenNavProp } from '@navigation/types';
import type { GameType, GameCategoryKey } from '@/types/games';
import {
  colors, gradients, radii, spacing, shadows,
  fontFamilies, fontSize, fontWeight, letterSpacing,
} from '@/theme/tokens';

const GAME_ORDER: GameType[] = [
  'would_you_rather',
  'this_or_that',
  'who_is_more_likely',
  'never_have_i_ever',
];

const CATEGORIES: { key: GameCategoryKey; label: string; emoji: string }[] = [
  { key: 'mixed', label: 'Mixed', emoji: '🎲' },
  { key: 'fun', label: 'Fun', emoji: '😄' },
  { key: 'romance', label: 'Romance', emoji: '💕' },
  { key: 'home', label: 'Home', emoji: '🏠' },
  { key: 'adventure', label: 'Adventure', emoji: '🌎' },
  { key: 'values', label: 'Values', emoji: '💎' },
  { key: 'spicy', label: 'Spicy', emoji: '🌶️' },
];

export function GamesScreen(): React.ReactElement {
  const navigation = useNavigation<PlayScreenNavProp>();
  const haptics = useHaptics();
  const selectedCategory = useGamesStore((s) => s.selectedCategory);
  const setSelectedCategory = useGamesStore((s) => s.setSelectedCategory);
  const { outgoingInvite, cancelInvite } = useGameInvite();
  const activeSessionId = useGamesStore((s) => s.activeSessionId);

  const handleGamePress = useCallback((gameType: GameType) => {
    void haptics.medium();
    navigation.navigate('GameLobby', { gameType, categoryKey: selectedCategory });
  }, [haptics, navigation, selectedCategory]);

  const handleCategoryPress = useCallback((key: GameCategoryKey) => {
    void haptics.light();
    setSelectedCategory(key);
  }, [haptics, setSelectedCategory]);

  const handleResume = useCallback(() => {
    if (!activeSessionId) return;
    void haptics.medium();
    navigation.navigate('GameSession', { sessionId: activeSessionId });
  }, [activeSessionId, haptics, navigation]);

  const handleCancelInvite = useCallback(async () => {
    if (!outgoingInvite) return;
    void haptics.light();
    await cancelInvite(outgoingInvite.id);
  }, [outgoingInvite, cancelInvite, haptics]);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={gradients.heroWash}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <Text style={styles.heading}>Play Together</Text>
          <Text style={styles.subheading}>Games that bring you closer</Text>
        </Animated.View>

        {/* Active Session Banner */}
        {activeSessionId ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.activeBanner}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Game in progress</Text>
            <TouchableOpacity
              style={styles.resumeBtn}
              onPress={handleResume}
              activeOpacity={0.85}
            >
              <Text style={styles.resumeLabel}>Resume</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}

        {/* Pending Invite Banner */}
        {outgoingInvite && !activeSessionId ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.pendingBanner}>
            <Text style={styles.pendingEmoji}>⏳</Text>
            <View style={styles.pendingContent}>
              <Text style={styles.pendingTitle}>Invite sent!</Text>
              <Text style={styles.pendingSubtext}>
                Waiting for your partner to accept…
              </Text>
            </View>
            <TouchableOpacity
              style={styles.pendingCancelBtn}
              onPress={handleCancelInvite}
              activeOpacity={0.7}
            >
              <Text style={styles.pendingCancelLabel}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : null}

        {/* Category Pills */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryPill,
                  selectedCategory === cat.key && styles.categoryPillActive,
                ]}
                onPress={() => handleCategoryPress(cat.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[
                  styles.categoryLabel,
                  selectedCategory === cat.key && styles.categoryLabelActive,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Game Cards */}
        {GAME_ORDER.map((gameType, i) => {
          const def = GAME_DEFINITIONS[gameType];
          return (
            <Animated.View
              key={gameType}
              entering={FadeInDown.delay(200 + i * 80).duration(400)}
            >
              <GameCard
                emoji={def.emoji}
                title={def.title}
                description={def.description}
                defaultRounds={def.defaultRounds}
                colorIndex={i}
                onPress={() => handleGamePress(gameType)}
              />
            </Animated.View>
          );
        })}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Game Card Component ────────────────────────────────────

interface GameCardProps {
  emoji: string;
  title: string;
  description: string;
  defaultRounds: number;
  colorIndex: number;
  onPress: () => void;
}

function GameCard({
  emoji, title, description, defaultRounds, colorIndex, onPress,
}: GameCardProps): React.ReactElement {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 100 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [scale]);

  const bgColors: [string, string][] = [
    [colors.muted, colors.background],
    [colors.accentSoft, colors.background],
    [colors.surfaceGame, colors.background],
    [colors.successSoft, colors.background],
  ];
  const bg = bgColors[colorIndex % bgColors.length];
  const accentColors = [colors.primary, colors.accent, colors.accentWarm, colors.success];
  const accent = accentColors[colorIndex % accentColors.length];

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.cardInner}>
          <View style={[styles.emojiCircle, { borderColor: accent }]}>
            <Text style={styles.cardEmoji}>{emoji}</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{description}</Text>
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardRounds}>{defaultRounds} rounds</Text>
            <View style={[styles.playChip, { backgroundColor: accent }]}>
              <Text style={styles.playChipLabel}>Play</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  container: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  heading: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    paddingTop: spacing.xl,
  },
  subheading: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.base,
    color: colors.gray,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  // Active session banner
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.successSoft,
    borderRadius: radii.radiusMd,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  activeText: {
    flex: 1,
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.successText,
  },
  resumeBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.radiusFull,
  },
  resumeLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  // Pending invite banner
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.radiusMd,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  pendingEmoji: { fontSize: 20 },
  pendingContent: { flex: 1, gap: spacing.xs },
  pendingTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  pendingSubtext: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.xs,
    color: colors.gray,
  },
  pendingCancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.radiusFull,
    backgroundColor: colors.muted,
  },
  pendingCancelLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.foregroundMuted,
  },
  // Category pills
  categoryScroll: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.radiusFull,
    backgroundColor: colors.background,
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
  // Game card
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.radius,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
    overflow: 'hidden',
  },
  cardInner: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  emojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceGame,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 24 },
  cardContent: {
    gap: spacing.xs,
  },
  cardTitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  cardDesc: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.sm,
    color: colors.foregroundMuted,
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  cardRounds: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.xs,
    color: colors.gray,
  },
  playChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.radiusFull,
  },
  playChipLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  bottomPad: { height: spacing['2xl'] },
});
