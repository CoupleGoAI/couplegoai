import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { UsScreenNavProp } from '@navigation/types';
import {
    colors,
    fontFamilies,
    fontSize,
    fontWeight,
    layout,
    radii,
    spacing,
} from '@/theme/tokens';

export function UsScreen(): React.ReactElement {
    const navigation = useNavigation<UsScreenNavProp>();

    const openLocalWellbeing = useCallback(() => {
        navigation.navigate('LocalWellbeingChat');
    }, [navigation]);

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.center}>
                <Text style={styles.emoji}>💑</Text>
                <Text style={styles.title}>Us</Text>
                <Text style={styles.subtitle}>Your couple profile coming soon</Text>
                <TouchableOpacity
                    onPress={openLocalWellbeing}
                    style={styles.wellbeingCta}
                    accessibilityRole="button"
                    accessibilityLabel="Open local well-being chat powered by Ollama"
                >
                    <Text style={styles.wellbeingCtaText}>Local well-being chat (Ollama)</Text>
                </TouchableOpacity>
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
    wellbeingCta: {
        marginTop: spacing.xl,
        paddingVertical: spacing.md,
        paddingHorizontal: layout.screenPaddingH,
        backgroundColor: colors.accentSoft,
        borderRadius: radii.radiusMd,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderDefault,
    },
    wellbeingCtaText: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        textAlign: 'center',
    },
});
