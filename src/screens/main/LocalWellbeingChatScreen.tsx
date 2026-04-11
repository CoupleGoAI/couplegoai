import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { RootNavProp } from '@navigation/types';
import { useLocalWellbeingChat } from '@hooks/useLocalWellbeingChat';
import {
    getConfiguredOllamaTherapyModel,
    getLocalTherapyOllamaBaseUrl,
} from '@data/localOllamaTherapyApi';
import GradientButton from '@components/ui/GradientButton';
import {
    colors,
    fontFamilies,
    fontSize,
    fontWeight,
    layout,
    radii,
    spacing,
} from '@/theme/tokens';

export function LocalWellbeingChatScreen(): React.ReactElement {
    const navigation = useNavigation<RootNavProp>();
    const { messages, isSending, error, send, clearError } = useLocalWellbeingChat();
    const [draft, setDraft] = useState('');

    const modelLabel = getConfiguredOllamaTherapyModel();
    const baseUrl = getLocalTherapyOllamaBaseUrl();

    const handleSend = useCallback(() => {
        const t = draft.trim();
        if (t.length === 0 || isSending) return;
        setDraft('');
        void send(t);
    }, [draft, isSending, send]);

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
            >
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={handleBack}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        style={styles.backBtn}
                    >
                        <Ionicons name="chevron-back" size={28} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Local well-being chat</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.disclaimer}>
                        This uses a model on your machine (Ollama). It is not therapy or medical
                        advice. For emergencies, contact local services or a crisis line.
                    </Text>
                    <Text style={styles.meta}>
                        Model: {modelLabel}
                        {'\n'}
                        URL: {baseUrl}
                    </Text>

                    {error ? (
                        <TouchableOpacity onPress={clearError} activeOpacity={0.8} style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                            <Text style={styles.errorDismiss}>Tap to dismiss</Text>
                        </TouchableOpacity>
                    ) : null}

                    {messages.map((m) => (
                        <View
                            key={m.id}
                            style={[
                                styles.bubble,
                                m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.bubbleText,
                                    m.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant,
                                ]}
                            >
                                {m.text}
                            </Text>
                        </View>
                    ))}

                    {isSending ? (
                        <View style={styles.typingRow}>
                            <ActivityIndicator color={colors.primary} size="small" />
                            <Text style={styles.typingLabel}>Thinking…</Text>
                        </View>
                    ) : null}
                </ScrollView>

                <View style={styles.composer}>
                    <TextInput
                        style={styles.input}
                        value={draft}
                        onChangeText={setDraft}
                        placeholder="How are you feeling?"
                        placeholderTextColor={colors.gray}
                        multiline
                        maxLength={2000}
                        editable={!isSending}
                    />
                    <GradientButton
                        label="Send"
                        onPress={handleSend}
                        disabled={draft.trim().length === 0 || isSending}
                        loading={isSending}
                        fullWidth
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: layout.screenPaddingH,
        minHeight: layout.headerHeight,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.borderDefault,
    },
    backBtn: {
        width: layout.minTapTarget,
        height: layout.minTapTarget,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.foreground,
    },
    headerSpacer: { width: layout.minTapTarget },
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: layout.screenPaddingH,
        paddingVertical: layout.screenPaddingV,
        gap: spacing.md,
        paddingBottom: spacing['2xl'],
    },
    disclaimer: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.regular,
        color: colors.foregroundMuted,
        lineHeight: 20,
    },
    meta: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.xs,
        fontWeight: fontWeight.regular,
        color: colors.gray,
    },
    errorBox: {
        backgroundColor: colors.errorBg,
        borderRadius: radii.radiusMd,
        padding: spacing.md,
    },
    errorText: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.sm,
        color: colors.error,
    },
    errorDismiss: {
        marginTop: spacing.xs,
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.xs,
        color: colors.gray,
    },
    bubble: {
        maxWidth: '92%',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radii.radius,
    },
    bubbleUser: {
        alignSelf: 'flex-end',
        backgroundColor: colors.muted,
    },
    bubbleAssistant: {
        alignSelf: 'flex-start',
        backgroundColor: colors.accentSoft,
    },
    bubbleText: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.base,
        lineHeight: 22,
    },
    bubbleTextUser: { color: colors.foreground },
    bubbleTextAssistant: { color: colors.foreground },
    typingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    typingLabel: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.sm,
        color: colors.gray,
    },
    composer: {
        paddingHorizontal: layout.screenPaddingH,
        paddingTop: spacing.md,
        paddingBottom: spacing.lg,
        gap: spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.borderDefault,
    },
    input: {
        minHeight: 44,
        maxHeight: 120,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        borderRadius: radii.radiusMd,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.base,
        color: colors.foreground,
        backgroundColor: colors.background,
    },
});
