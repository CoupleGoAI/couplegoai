import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { colors, gradients, fontFamilies, fontSize, fontWeight, letterSpacing, spacing } from '@/theme/tokens';
import { images } from '@/theme/images';

// ─── Breathing Logo ───────────────────────────────────────────────────────────

const BreathingLogo: React.FC = () => {
    const scale = useSharedValue(1);
    const glowOpacity = useSharedValue(0.25);

    useEffect(() => {
        scale.value = withRepeat(
            withTiming(1.1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
            -1,
            true,
        );
        glowOpacity.value = withRepeat(
            withTiming(0.7, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
            -1,
            true,
        );
    }, [scale, glowOpacity]);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowOpacity.value,
    }));

    return (
        <View style={styles.logoContainer}>
            <Animated.View style={[styles.glow, glowStyle]} />
            <Animated.Image 
                style={[styles.logoImage, logoStyle]}
                source={images.logoMask} 
            />
        </View>
    );
};

// ─── Loading Dot ──────────────────────────────────────────────────────────────

const LoadingDot: React.FC<{ delay: number }> = ({ delay }) => {
    const opacity = useSharedValue(0.2);

    useEffect(() => {
        opacity.value = withRepeat(
            withDelay(delay, withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) })),
            -1,
            true,
        );
    }, [opacity, delay]);

    const dotStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return <Animated.View style={[styles.dot, dotStyle]} />;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SplashScreen(): React.ReactElement {
    return (
        <LinearGradient
            colors={gradients.brand}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.container}
        >
            <View style={styles.center}>
                <BreathingLogo />
                <Text style={styles.appName}>CoupleGoAI</Text>
            </View>
            <View style={styles.dotsRow}>
                <LoadingDot delay={0} />
                <LoadingDot delay={200} />
                <LoadingDot delay={400} />
            </View>
        </LinearGradient>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    center: {
        alignItems: 'center',
        gap: spacing.xl,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.white,
    },
    logoImage: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
    },
    appName: {
        fontFamily: fontFamilies.serifBold,
        fontSize: fontSize['3xl'],
        fontWeight: fontWeight.bold,
        color: colors.white,
        letterSpacing: letterSpacing.tight,
    },
    dotsRow: {
        position: 'absolute',
        bottom: 64,
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.white,
    },
});
