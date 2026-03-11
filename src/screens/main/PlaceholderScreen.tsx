import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientButton from '@components/ui/GradientButton';
import { useAuth } from '@hooks/useAuth';
import { usePairing } from '@hooks/usePairing';
import { useAuthStore } from '@store/authStore';
import { colors, textStyles, spacing } from '@/theme/tokens';

export default function PlaceholderScreen() {
    const { signOut } = useAuth();
    const { disconnect, isPending: isDisconnecting } = usePairing();
    const coupleId = useAuthStore((s) => s.user?.coupleId ?? null);
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleDisconnect = () => {
        Alert.alert(
            'Disconnect from partner',
            'Are you sure you want to disconnect? Both you and your partner will return to unpaired state.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disconnect',
                    style: 'destructive',
                    onPress: () => { void disconnect(); },
                },
            ],
        );
    };

    const handleSignOut = () => {
        setIsSigningOut(true);
        void signOut().finally(() => setIsSigningOut(false));
    };

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.emoji}>🎉</Text>
                <Text style={styles.title}>You&apos;re in!</Text>
                <Text style={styles.subtitle}>
                    Welcome to CoupleGoAI. More features coming soon.
                </Text>

                {coupleId !== null && (
                    <GradientButton
                        label="Disconnect from partner"
                        onPress={handleDisconnect}
                        variant="outline"
                        size="md"
                        loading={isDisconnecting}
                    />
                )}

                <GradientButton
                    label="Sign Out"
                    onPress={handleSignOut}
                    variant="outline"
                    size="md"
                    loading={isSigningOut}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
        gap: spacing.lg,
    },
    emoji: {
        fontSize: 64,
    },
    title: {
        ...textStyles.displaySm,
        color: colors.foreground,
        textAlign: 'center',
    },
    subtitle: {
        ...textStyles.bodyMd,
        color: colors.gray,
        textAlign: 'center',
    },
});
