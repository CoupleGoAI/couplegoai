import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, shadows } from '@/theme/tokens';
import { images } from '@/theme/images';

export const BUTTON_SIZE = 62;
export const BREATHING_RING_SIZE = BUTTON_SIZE + 34;

const INHALE_DURATION = 2400;
const HOLD_AFTER_INHALE_DURATION = 500;
const EXHALE_DURATION = 2200;
const HOLD_AFTER_EXHALE_DURATION = 700;
const BREATH_CYCLE_DURATION =
    INHALE_DURATION +
    HOLD_AFTER_INHALE_DURATION +
    EXHALE_DURATION +
    HOLD_AFTER_EXHALE_DURATION;

interface AtmosphericWaveProps {
    delay: number;
    size: number;
    color: string;
}

const AtmosphericWave: React.FC<AtmosphericWaveProps> = ({ delay, size, color }) => {
    const phase = useSharedValue(0);

    useEffect(() => {
        phase.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: BREATH_CYCLE_DURATION, easing: Easing.linear }),
                    withTiming(0, { duration: 0 }),
                ),
                -1,
                false,
            ),
        );
    }, [delay, phase]);

    const animStyle = useAnimatedStyle(() => ({
        transform: [
            {
                scale: interpolate(phase.value, [0, 0.2, 0.72, 1], [0.84, 0.96, 1.32, 1.46]),
            },
        ],
        opacity: interpolate(phase.value, [0, 0.14, 0.48, 0.82, 1], [0, 0.14, 0.09, 0.025, 0]),
    }));

    return (
        <Animated.View
            style={[
                styles.wave,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                },
                animStyle,
            ]}
        />
    );
};

interface BreathingButtonProps {
    onPress: () => void;
}

export const BreathingButton: React.FC<BreathingButtonProps> = ({ onPress }) => {
    const breath = useSharedValue(0);
    const float = useSharedValue(0);

    useEffect(() => {
        breath.value = withRepeat(
            withSequence(
                withTiming(1, {
                    duration: INHALE_DURATION,
                    easing: Easing.bezier(0.22, 1, 0.36, 1),
                }),
                withTiming(1, { duration: HOLD_AFTER_INHALE_DURATION }),
                withTiming(0, {
                    duration: EXHALE_DURATION,
                    easing: Easing.bezier(0.4, 0, 0.2, 1),
                }),
                withTiming(0, { duration: HOLD_AFTER_EXHALE_DURATION }),
            ),
            -1,
            false,
        );

        float.value = withRepeat(
            withSequence(
                withTiming(1, {
                    duration: BREATH_CYCLE_DURATION / 2,
                    easing: Easing.inOut(Easing.sin),
                }),
                withTiming(0, {
                    duration: BREATH_CYCLE_DURATION / 2,
                    easing: Easing.inOut(Easing.sin),
                }),
            ),
            -1,
            false,
        );
    }, [breath, float]);

    const mainOrbStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY:
                    interpolate(float.value, [0, 1], [1.5, -1.5]) +
                    interpolate(breath.value, [0, 1], [0.8, -1.9]),
            },
            {
                scale: interpolate(breath.value, [0, 0.6, 1], [0.985, 1.035, 1.075]),
            },
        ],
    }));

    const primaryAuraStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(breath.value, [0, 1], [0.92, 1.18]) }],
        opacity: interpolate(breath.value, [0, 0.32, 1], [0.08, 0.14, 0.22]),
    }));

    const accentAuraStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(breath.value, [0, 1], [0.98, 1.28]) }],
        opacity: interpolate(breath.value, [0, 1], [0.03, 0.11]),
    }));

    const glowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(breath.value, [0, 1], [0.96, 1.16]) }],
        opacity: interpolate(breath.value, [0, 0.25, 1], [0.12, 0.22, 0.34]),
    }));

    const innerGlowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: interpolate(breath.value, [0, 1], [0.82, 1.05]) }],
        opacity: interpolate(breath.value, [0, 0.3, 1], [0.08, 0.14, 0.26]),
    }));

    const iconStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: interpolate(breath.value, [0, 1], [0.5, -0.8]) },
            { scale: interpolate(breath.value, [0, 1], [0.97, 1.03]) },
        ],
        opacity: interpolate(breath.value, [0, 1], [0.94, 1]),
    }));

    return (
        <Pressable onPress={onPress} style={styles.wrapper} hitSlop={10}>
            <AtmosphericWave delay={0} size={BREATHING_RING_SIZE - 2} color={colors.primary} />
            <AtmosphericWave
                delay={Math.round(BREATH_CYCLE_DURATION * 0.28)}
                size={BREATHING_RING_SIZE + 10}
                color={colors.accent}
            />
            <AtmosphericWave
                delay={Math.round(BREATH_CYCLE_DURATION * 0.56)}
                size={BREATHING_RING_SIZE + 18}
                color={colors.primaryLight}
            />

            <Animated.View style={[styles.primaryAura, primaryAuraStyle]} />
            <Animated.View style={[styles.accentAura, accentAuraStyle]} />

            <Animated.View style={[styles.mainOrbWrap, mainOrbStyle]}>
                <Animated.View style={[styles.glowLayer, glowStyle]} />
                <LinearGradient
                    colors={gradients.brand}
                    start={{ x: 0.12, y: 0.1 }}
                    end={{ x: 0.9, y: 0.92 }}
                    style={[styles.button, shadows.glowPrimary]}
                >
                    <Animated.View style={[styles.innerGlow, innerGlowStyle]} />
                    <Animated.View style={iconStyle}>
                        <Image source={images.iconWhite} style={styles.icon} resizeMode="contain" />
                    </Animated.View>
                </LinearGradient>
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: BREATHING_RING_SIZE,
        height: BREATHING_RING_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    wave: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: colors.white,
    },
    primaryAura: {
        position: 'absolute',
        width: BUTTON_SIZE + 18,
        height: BUTTON_SIZE + 18,
        borderRadius: (BUTTON_SIZE + 18) / 2,
        backgroundColor: colors.primary,
    },
    accentAura: {
        position: 'absolute',
        width: BUTTON_SIZE + 30,
        height: BUTTON_SIZE + 30,
        borderRadius: (BUTTON_SIZE + 30) / 2,
        backgroundColor: colors.accent,
    },
    mainOrbWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowLayer: {
        position: 'absolute',
        width: BUTTON_SIZE + 8,
        height: BUTTON_SIZE + 8,
        borderRadius: (BUTTON_SIZE + 8) / 2,
        backgroundColor: colors.primaryLight,
    },
    button: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    innerGlow: {
        position: 'absolute',
        width: BUTTON_SIZE - 8,
        height: BUTTON_SIZE - 8,
        borderRadius: (BUTTON_SIZE - 8) / 2,
        backgroundColor: colors.white,
    },
    icon: {
        width: 43,
        height: 43,
    },
});
