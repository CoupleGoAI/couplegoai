import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { RootNavProp } from '@navigation/types';
import { colors, gradients, radii, spacing, shadows, fontFamilies, fontSize, fontWeight } from '@/theme/tokens';

export function HomeScreen(): React.ReactElement {
    const navigation = useNavigation<RootNavProp>();

    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
                <Text style={styles.greeting}>Good to see you</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AiChat')}
                    activeOpacity={0.88}
                    style={styles.card}
                >
                    <LinearGradient
                        colors={gradients.brandSoft}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardGradient}
                    >
                        <Ionicons name="chatbubble-ellipses" size={28} color={colors.primary} />
                        <View style={styles.cardText}>
                            <Text style={styles.cardTitle}>AI Companion</Text>
                            <Text style={styles.cardSubtitle}>Talk through what's on your mind</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                    </LinearGradient>
                </TouchableOpacity>
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
        paddingHorizontal: spacing.xl,
        paddingTop: spacing['2xl'],
    },
    greeting: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize['2xl'],
        fontWeight: fontWeight.bold,
        color: colors.foreground,
        marginBottom: spacing.xl,
    },
    card: {
        borderRadius: radii.radius,
        overflow: 'hidden',
        ...shadows.md,
    },
    cardGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
        padding: spacing.xl,
        borderRadius: radii.radius,
    },
    cardText: {
        flex: 1,
    },
    cardTitle: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
        marginBottom: spacing.xs,
    },
    cardSubtitle: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.regular,
        color: colors.foregroundMuted,
    },
});
