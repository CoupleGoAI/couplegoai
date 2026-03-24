import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, {
    FadeInDown,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
} from 'react-native-reanimated';
import { useAuthStore } from '@store/authStore';
import type { RootNavProp } from '@navigation/types';
import {
    colors,
    gradients,
    radii,
    spacing,
    shadows,
    fontFamilies,
    fontSize,
    fontWeight,
    textStyles,
} from '@/theme/tokens';

function timeGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HomeScreen(): React.ReactElement {
    const navigation = useNavigation<RootNavProp>();
    const name = useAuthStore((s) => s.user?.name ?? null);
    const firstName = name?.split(' ')[0] ?? null;

    const chatScale = useSharedValue(1);
    const chatAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: chatScale.value }],
    }));

    return (
        <SafeAreaView style={styles.safe}>
            <LinearGradient
                colors={gradients.heroWash}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.3, y: 0 }}
                end={{ x: 0.7, y: 1 }}
            />

            <View style={styles.container}>
                {/* Greeting */}
                <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.greetingRow}>
                    <View>
                        <Text style={styles.greetingLabel}>{timeGreeting()}</Text>
                        {firstName !== null && (
                            <Text style={styles.greetingName}>{firstName}</Text>
                        )}
                    </View>
                </Animated.View>

                {/* Spacer */}
                <View style={styles.spacer} />

                {/* AI Chat — large portal card */}
                <Animated.View entering={FadeInDown.delay(140).duration(420).springify()} style={chatAnimStyle}>
                    <AnimatedPressable
                        onPress={() => navigation.navigate('AiChat')}
                        onPressIn={() => { chatScale.value = withTiming(0.97, { duration: 120 }); }}
                        onPressOut={() => { chatScale.value = withSpring(1, { damping: 14, stiffness: 200 }); }}
                    >
                        <LinearGradient
                            colors={[colors.accentSoft, colors.muted]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.chatCard}
                        >
                            <View style={styles.chatIconRing}>
                                <LinearGradient
                                    colors={gradients.brand}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.chatIconGradient}
                                >
                                    <Ionicons name="chatbubble-ellipses" size={28} color={colors.white} />
                                </LinearGradient>
                            </View>
                            <Text style={styles.chatTitle}>AI Companion</Text>
                            <Text style={styles.chatSubtitle}>
                                Talk through what's on your mind — I'm here to listen.
                            </Text>
                            <View style={styles.chatCta}>
                                <Text style={styles.chatCtaText}>Start chatting</Text>
                                <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                            </View>
                        </LinearGradient>
                    </AnimatedPressable>
                </Animated.View>

                {/* Profile pill */}
                <Animated.View entering={FadeInDown.delay(240).duration(400)}>
                    <TouchableOpacity
                        style={styles.profilePill}
                        activeOpacity={0.82}
                        onPress={() => { /* TODO: navigate to Profile screen */ }}
                    >
                        <View style={styles.profileAvatar}>
                            <Text style={styles.profileInitial}>
                                {firstName?.charAt(0).toUpperCase() ?? '?'}
                            </Text>
                        </View>
                        <Text style={styles.profileLabel}>Profile</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.gray} style={styles.profileChevron} />
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.bottomPad} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, paddingHorizontal: spacing.xl },
    greetingRow: { paddingTop: spacing.xl },
    greetingLabel: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.gray,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    greetingName: {
        ...textStyles.displaySm,
        color: colors.foreground,
        marginTop: spacing.xs,
    },
    spacer: { flex: 1 },
    chatCard: {
        borderRadius: radii.radius,
        padding: spacing.xl,
        paddingBottom: spacing['2xl'],
        gap: spacing.md,
        ...shadows.md,
    },
    chatIconRing: { alignSelf: 'flex-start', marginBottom: spacing.sm },
    chatIconGradient: {
        width: 56,
        height: 56,
        borderRadius: radii.radiusFull,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.glowPrimary,
    },
    chatTitle: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize['2xl'],
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    chatSubtitle: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.base,
        fontWeight: fontWeight.regular,
        color: colors.foregroundMuted,
        lineHeight: fontSize.base * 1.6,
    },
    chatCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.sm,
    },
    chatCtaText: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.primary,
    },
    profilePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: radii.radiusFull,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        marginTop: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        gap: spacing.md,
        ...shadows.sm,
    },
    profileAvatar: {
        width: 36,
        height: 36,
        borderRadius: radii.radiusFull,
        backgroundColor: colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInitial: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: colors.accent,
    },
    profileLabel: {
        flex: 1,
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.base,
        fontWeight: fontWeight.medium,
        color: colors.foreground,
    },
    profileChevron: { marginLeft: 'auto' },
    bottomPad: { height: spacing['2xl'] },
});
