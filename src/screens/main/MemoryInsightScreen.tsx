import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@data/supabase';
import { colors, gradients, textStyles, radii, spacing } from '@/theme/tokens';
import type { MemoryInsightScreenProps } from '@navigation/types';

const TRAIT_LABELS: Record<string, string> = {
    personality: 'Personality',
    likes: 'Likes',
    dislikes: 'Dislikes',
    fears: 'Fears & worries',
    experiences: 'Past experiences',
    pain_points: 'Pain points',
    preferences: 'Preferences',
    goals: 'Goals',
};

interface MemoryRow {
    summary: string;
    traits: Record<string, string>;
    updated_at: string | null;
}

export default function MemoryInsightScreen({ navigation }: MemoryInsightScreenProps): React.ReactElement {
    const [memory, setMemory] = useState<MemoryRow | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const { data, error: fetchErr } = await supabase
            .from('user_memory')
            .select('summary, traits, updated_at')
            .maybeSingle();

        if (fetchErr) {
            setError('Could not load memory data. Try again later.');
        } else {
            setMemory(data as MemoryRow | null);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const traitEntries = Object.entries(memory?.traits ?? {}).filter(
        ([key, val]) => TRAIT_LABELS[key] !== undefined && typeof val === 'string' && val.trim().length > 0,
    );

    const hasSummary = (memory?.summary ?? '').trim().length > 0;
    const hasAnyContent = hasSummary || traitEntries.length > 0;

    const formattedDate = memory?.updated_at
        ? new Date(memory.updated_at).toLocaleDateString(undefined, {
              year: 'numeric', month: 'short', day: 'numeric',
          })
        : null;

    return (
        <SafeAreaView style={styles.safe}>
            <LinearGradient colors={gradients.heroWash} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Text style={styles.backLabel}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>What the AI knows</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {isLoading ? (
                    <View style={styles.centred}>
                        <ActivityIndicator color={colors.primary} />
                    </View>
                ) : error ? (
                    <View style={styles.centred}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity onPress={() => { void load(); }} activeOpacity={0.7} style={styles.retryBtn}>
                            <Text style={styles.retryLabel}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : !hasAnyContent ? (
                    <View style={styles.centred}>
                        <Text style={styles.emptyTitle}>Nothing stored yet</Text>
                        <Text style={styles.emptyBody}>
                            As you chat, the AI builds a picture of you to personalise responses.
                            It updates in the background after every few messages.
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={styles.disclaimer}>
                            This is a summary the AI uses to personalise responses. It is abstract and
                            anonymised — no names, emails, or identifying details are stored.
                        </Text>

                        {hasSummary && (
                            <View style={styles.card}>
                                <Text style={styles.cardLabel}>Overview</Text>
                                <Text style={styles.cardBody}>{memory!.summary.trim()}</Text>
                            </View>
                        )}

                        {traitEntries.map(([key, val]) => (
                            <View key={key} style={styles.card}>
                                <Text style={styles.cardLabel}>{TRAIT_LABELS[key] ?? key}</Text>
                                <Text style={styles.cardBody}>{val.trim()}</Text>
                            </View>
                        ))}

                        {formattedDate && (
                            <Text style={styles.updatedAt}>Last updated {formattedDate}</Text>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    backLabel: {
        ...textStyles.bodyMd,
        color: colors.primary,
        fontWeight: '600',
    },
    title: {
        ...textStyles.bodyLg,
        color: colors.foreground,
        fontWeight: '700',
    },
    headerSpacer: {
        width: 48,
    },
    scroll: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing['2xl'],
        flexGrow: 1,
    },
    centred: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing.xl,
        gap: spacing.md,
    },
    errorText: {
        ...textStyles.bodyMd,
        color: colors.error,
        textAlign: 'center',
    },
    retryBtn: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: radii.radiusFull,
        backgroundColor: colors.muted,
    },
    retryLabel: {
        ...textStyles.bodyMd,
        color: colors.primary,
        fontWeight: '600',
    },
    emptyTitle: {
        ...textStyles.bodyLg,
        color: colors.foreground,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptyBody: {
        ...textStyles.bodyMd,
        color: colors.foregroundMuted,
        textAlign: 'center',
        maxWidth: 280,
    },
    disclaimer: {
        ...textStyles.bodySm,
        color: colors.gray,
        marginBottom: spacing.lg,
        lineHeight: 20,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radii.radiusMd,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    cardLabel: {
        ...textStyles.labelSm,
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    cardBody: {
        ...textStyles.bodyMd,
        color: colors.foreground,
        lineHeight: 22,
    },
    updatedAt: {
        ...textStyles.bodySm,
        color: colors.gray,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
});
