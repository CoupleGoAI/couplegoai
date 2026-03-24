import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radii, spacing, shadows, fontFamilies, fontSize } from '@/theme/tokens';

interface InputBarProps {
    onSend: (text: string) => void;
    disabled: boolean;
}

export const InputBar: React.FC<InputBarProps> = React.memo(({ onSend, disabled }) => {
    const [text, setText] = useState('');

    const handleSend = useCallback(() => {
        const trimmed = text.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setText('');
    }, [text, disabled, onSend]);

    const canSend = text.trim().length > 0 && !disabled;

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="Say something..."
                placeholderTextColor={colors.gray}
                multiline
                maxLength={2000}
                returnKeyType="default"
                editable={!disabled}
            />
            <TouchableOpacity
                onPress={handleSend}
                disabled={!canSend}
                activeOpacity={0.85}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
                <LinearGradient
                    colors={canSend ? gradients.brand : gradients.disabled}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                >
                    <Ionicons name="arrow-up" size={20} color={colors.white} />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
});

InputBar.displayName = 'InputBar';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: spacing.sm,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.borderDefault,
    },
    input: {
        flex: 1,
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.base,
        color: colors.foreground,
        backgroundColor: colors.muted,
        borderRadius: radii.radiusMd,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        maxHeight: 120,
        minHeight: 48,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: radii.radiusFull,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
        ...shadows.glowPrimary,
    },
    sendButtonDisabled: {
        ...shadows.none,
    },
});
