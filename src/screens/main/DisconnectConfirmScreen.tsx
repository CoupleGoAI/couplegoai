import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    FadeInDown,
} from 'react-native-reanimated';
import GradientButton from '@components/ui/GradientButton';
import { usePairing } from '@hooks/usePairing';
import type { DisconnectConfirmScreenProps } from '@navigation/types';
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

const COUNTDOWN_SECONDS = 10;
const COUNTDOWN_DURATION_MS = COUNTDOWN_SECONDS * 1000;
const DISABLED_OPACITY = 0.45;

export default function DisconnectConfirmScreen({
    navigation,
}: DisconnectConfirmScreenProps): React.ReactElement {
    const { disconnect, isPending, error } = usePairing();
    const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
    const [disconnecting, setDisconnecting] = useState(false);
    const hasDisconnected = useRef(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const progress = useSharedValue(0);
    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%` as `${number}%`,
    }));

    useEffect(() => {
        progress.value = withTiming(1, { duration: COUNTDOWN_DURATION_MS });
    }, [progress]);

    const handleDisconnect = useCallback(async (): Promise<void> => {
        if (hasDisconnected.current || disconnecting) return;
        hasDisconnected.current = true;
        setDisconnecting(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        await disconnect();
        navigation.navigate('Home');
    }, [disconnect, navigation, disconnecting]);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setSeconds((prev) => {
                const next = prev - 1;
                if (next <= 0) {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    return 0;
                }
                return next;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const isDisabled = isPending || disconnecting;
    const countdownActive = seconds > 0;

    return (
        <SafeAreaView style={styles.safe}>
            <LinearGradient
                colors={gradients.heroWash}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />

            <View style={styles.content}>
                <Animated.View entering={FadeInDown.duration(400)} style={styles.center}>
                    <Ionicons name="heart-dislike-outline" size={56} color={colors.primary} />

                    <Text style={styles.title}>Disconnect?</Text>
                    <Text style={styles.subtitle}>
                        This will remove your couple connection. You can reconnect later by
                        scanning a new QR code.
                    </Text>

                    <View style={styles.progressBar}>
                        <Animated.View style={[styles.progressFill, progressStyle]} />
                    </View>

                    <Text style={styles.countdownText}>
                        {countdownActive ? `Available in ${seconds}s` : 'Ready to confirm'}
                    </Text>
                </Animated.View>

                {error !== null && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={16} color={colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {isDisabled && (
                    <ActivityIndicator
                        color={colors.primary}
                        size="small"
                        style={styles.spinner}
                    />
                )}

                <View style={styles.buttons}>
                    <GradientButton
                        label="Cancel"
                        variant="outline"
                        onPress={() => navigation.goBack()}
                        fullWidth
                        disabled={isDisabled}
                    />

                    <TouchableOpacity
                        style={[
                            styles.disconnectBtn,
                            (countdownActive || isDisabled) && styles.disabled,
                        ]}
                        activeOpacity={0.8}
                        disabled={countdownActive || isDisabled}
                        onPress={() => { void handleDisconnect(); }}
                    >
                        <Text style={styles.disconnectLabel}>Confirm disconnect</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    center: { alignItems: 'center', gap: spacing.lg },
    title: {
        ...textStyles.displaySm,
        color: colors.foreground,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.base,
        fontWeight: fontWeight.regular,
        color: colors.foregroundMuted,
        textAlign: 'center',
        maxWidth: 300,
        lineHeight: fontSize.base * 1.6,
    },
    progressBar: {
        width: '80%',
        height: 6,
        borderRadius: radii.radiusFull,
        backgroundColor: colors.borderDefault,
        overflow: 'hidden',
        marginTop: spacing.md,
    },
    progressFill: {
        height: '100%',
        borderRadius: radii.radiusFull,
        backgroundColor: colors.primary,
    },
    countdownText: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.gray,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.errorBg,
        borderRadius: radii.radiusSm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
        marginTop: spacing.xl,
    },
    errorText: {
        flex: 1,
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.error,
    },
    spinner: { marginTop: spacing.lg },
    buttons: {
        marginTop: spacing['2xl'],
        gap: spacing.lg,
        alignItems: 'center',
    },
    disconnectBtn: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: radii.radiusFull,
        borderWidth: 1.5,
        borderColor: colors.error,
        ...shadows.sm,
    },
    disabled: { opacity: DISABLED_OPACITY },
    disconnectLabel: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.base,
        fontWeight: fontWeight.semibold,
        color: colors.error,
    },
});
