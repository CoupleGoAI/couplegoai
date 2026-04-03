import React, { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useGameInvite } from '@hooks/useGameInvite';
import { useHaptics } from '@hooks/useHaptics';
import { GAME_DEFINITIONS } from '@/domain/games/catalog';
import type { RootNavProp } from '@navigation/types';
import type { GameType } from '@/types/games';
import { colors, radii, spacing, shadows, fontFamilies, fontSize, fontWeight } from '@/theme/tokens';

export function GameInviteHost(): React.ReactElement | null {
  const { pendingInvite, acceptInvite, declineInvite, isLoading } = useGameInvite();
  const navigation = useNavigation<RootNavProp>();
  const haptics = useHaptics();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (pendingInvite) {
      void haptics.medium();
      pulse.value = withRepeat(
        withTiming(1.02, { duration: 1200 }),
        -1,
        true,
      );
    }
  }, [pendingInvite, haptics, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const handleAccept = useCallback(async () => {
    if (!pendingInvite) return;
    void haptics.success();
    const sessionId = await acceptInvite(pendingInvite.id);
    if (sessionId) {
      navigation.navigate('GameSession', { sessionId });
    }
  }, [pendingInvite, acceptInvite, haptics, navigation]);

  const handleDecline = useCallback(async () => {
    if (!pendingInvite) return;
    void haptics.light();
    await declineInvite(pendingInvite.id);
  }, [pendingInvite, declineInvite, haptics]);

  if (!pendingInvite) return null;

  const gameDef = GAME_DEFINITIONS[pendingInvite.gameType as GameType];

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      exiting={FadeOutDown.duration(250)}
      style={[styles.container, pulseStyle]}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>{gameDef?.emoji ?? '🎮'}</Text>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Game invite!</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {gameDef?.title ?? 'Game'} — {pendingInvite.categoryKey}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.declineBtn}
          onPress={handleDecline}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.declineLabel}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={handleAccept}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.acceptLabel}>
            {isLoading ? 'Joining…' : 'Play!'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.radius,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    ...shadows.lg,
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  emoji: { fontSize: 32 },
  textWrap: { flex: 1, gap: spacing.xs },
  title: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  subtitle: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.sm,
    color: colors.foregroundMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.radiusFull,
    backgroundColor: colors.muted,
    alignItems: 'center',
  },
  declineLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.foregroundMuted,
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.radiusFull,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  acceptLabel: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
