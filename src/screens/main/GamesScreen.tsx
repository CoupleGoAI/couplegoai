import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontFamilies, fontSize, fontWeight, spacing } from '@/theme/tokens';

export function GamesScreen(): React.ReactElement {
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.center}>
                <Text style={styles.emoji}>🎮</Text>
                <Text style={styles.title}>Play</Text>
                <Text style={styles.subtitle}>Games coming soon</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    emoji: { fontSize: 48 },
    title: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize['2xl'],
        fontWeight: fontWeight.bold,
        color: colors.foreground,
    },
    subtitle: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.base,
        fontWeight: fontWeight.regular,
        color: colors.gray,
    },
});
