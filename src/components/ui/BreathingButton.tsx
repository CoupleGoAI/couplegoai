import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SeahorseIcon } from './SeahorseIcon';
import { gradients, colors, shadows } from '@/theme/tokens';

export const BUTTON_SIZE = 62;
export const BREATHING_RING_SIZE = BUTTON_SIZE + 20;

interface BreathingRingProps {
    delay: number;
}

const BreathingRing: React.FC<BreathingRingProps> = ({ delay }) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(1.7, { duration: 2200, easing: Easing.out(Easing.quad) }),
                    withTiming(1, { duration: 0 }),
                ),
                -1,
                false,
            ),
        );
        opacity.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(0.35, { duration: 80 }),
                    withTiming(0, { duration: 2120, easing: Easing.out(Easing.quad) }),
                    withTiming(0, { duration: 0 }),
                ),
                -1,
                false,
            ),
        );
    }, [scale, opacity, delay]);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return <Animated.View style={[styles.ring, animStyle]} />;
};

interface BreathingButtonProps {
    onPress: () => void;
}

export const BreathingButton: React.FC<BreathingButtonProps> = ({ onPress }) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.08, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
                withTiming(0.96, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
            ),
            -1,
            false,
        );
    }, [scale]);

    const buttonAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable onPress={onPress} style={styles.wrapper}>
            <BreathingRing delay={0} />
            <BreathingRing delay={1100} />
            <Animated.View style={buttonAnimStyle}>
                <LinearGradient
                    colors={gradients.brand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.button, shadows.glowPrimary]}
                >
                    <SeahorseIcon />
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
    ring: {
        position: 'absolute',
        width: BREATHING_RING_SIZE,
        height: BREATHING_RING_SIZE,
        borderRadius: BREATHING_RING_SIZE / 2,
        backgroundColor: colors.primary,
    },
    button: {
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        borderRadius: BUTTON_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
