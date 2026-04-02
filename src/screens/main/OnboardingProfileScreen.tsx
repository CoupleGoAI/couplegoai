import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import GradientButton from '@components/ui/GradientButton';
import { DevMenu } from '@components/ui/DevMenu';
import { InteractiveMessageBubble } from '@components/chat/interactive/InteractiveMessageBubble';
import { ChatContainer } from '@components/ui/Chat';
import { useOnboarding } from '@hooks/useOnboarding';
import { useAuth } from '@hooks/useAuth';
import { useAuthStore } from '@store/authStore';
import { colors, gradients, fontFamilies, letterSpacing } from '@/theme/tokens';
import type { OnboardingProfileScreenProps } from '@navigation/types';
import type { ChatMessage } from '@/types/index';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPING_DELAY_MIN_MS = 300;
const TYPING_DELAY_MAX_MS = 600;

function randomTypingDelay(): number {
    return Math.floor(Math.random() * (TYPING_DELAY_MAX_MS - TYPING_DELAY_MIN_MS + 1)) + TYPING_DELAY_MIN_MS;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function OnboardingProfileScreen(_props: OnboardingProfileScreenProps): React.ReactElement {
    const {
        messages,
        isComplete,
        isLoading,
        error,
        sendMessage,
        isInitializing,
        startPairing,
        hasActivePicker,
        confirmDatePicker,
    } = useOnboarding();

    const [showTyping, setShowTyping] = useState(false);
    const [isDevMenuVisible, setIsDevMenuVisible] = useState(false);
    const hasTriggeredFirst = useRef(false);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastCompletionEmojiTapRef = useRef(0);
    const { signOut } = useAuth();
    const userAvatar = useAuthStore((s) => s.user?.avatarUrl ?? null);
    const userName = useAuthStore((s) => s.user?.name ?? null);

    useEffect(() => {
        return () => {
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        };
    }, []);

    // Auto-trigger first AI greeting
    useEffect(() => {
        if (hasTriggeredFirst.current) return;
        if (isInitializing) return;
        if (messages.length === 0) {
            hasTriggeredFirst.current = true;
            setShowTyping(true);
            typingTimerRef.current = setTimeout(() => {
                setShowTyping(false);
                void sendMessage('');
            }, randomTypingDelay());
        }
    }, [isInitializing, messages.length, sendMessage]);

    // Map to ChatMessage (exclude synthetic interactive entries)
    const chatMessages = useMemo((): ChatMessage[] =>
        messages
            .filter((m) => m.role !== 'interactive')
            .map((m) => ({
                id: m.id,
                role: m.role as 'user' | 'assistant',
                text: m.content,
                timestamp: m.createdAt,
            })),
        [messages],
    );

    // Extract active interactive picker payload if present
    const activePicker = useMemo(
        () => messages.find((m) => m.role === 'interactive')?.interactive ?? null,
        [messages],
    );

    const footerSlot = useMemo((): React.ReactElement | null => {
        if (activePicker !== null) {
            return (
                <InteractiveMessageBubble 
                    payload={{ ...activePicker, title: 'When is your birthday?' }} 
                    onConfirm={confirmDatePicker} 
                />
            );
        }
        return null;
    }, [activePicker, confirmDatePicker]);

    const handleSend = useCallback(
        (text: string) => { void sendMessage(text); },
        [sendMessage],
    );

    const handleCompletionEmojiPress = useCallback(() => {
        if (!__DEV__) return;
        const now = Date.now();
        if (now - lastCompletionEmojiTapRef.current < 350) {
            setIsDevMenuVisible(true);
        }
        lastCompletionEmojiTapRef.current = now;
    }, []);

    const handleDevSignOut = useCallback(async () => {
        setIsDevMenuVisible(false);
        await signOut();
    }, [signOut]);

    // ── Loading splash ─────────────────────────────────────────────────────────
    if (isInitializing) {
        return (
            <LinearGradient colors={gradients.heroWash} style={styles.flex}>
                <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
                    <View className="flex-1 items-center justify-center px-5 gap-xl">
                        <Text style={styles.emoji}>💕</Text>
                        <ActivityIndicator color={colors.primary} size="large" />
                        <Text className="text-base text-gray text-center">Getting things ready…</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    // ── Completion screen ──────────────────────────────────────────────────────
    if (isComplete) {
        return (
            <LinearGradient colors={gradients.heroWash} style={styles.flex}>
                <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
                    <View className="flex-1 items-center justify-center px-5 gap-xl">
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={handleCompletionEmojiPress}
                            accessibilityRole={__DEV__ ? 'button' : undefined}
                            accessibilityLabel={__DEV__ ? 'Open developer menu' : undefined}
                        >
                            <Text style={styles.completionEmoji}>🎉</Text>
                        </TouchableOpacity>
                        <Text
                            className="text-3xl font-bold text-foreground text-center"
                            style={styles.serifFont}
                        >
                            You&apos;re all set!
                        </Text>
                        <Text
                            className="text-base text-gray text-center"
                            style={styles.completionSubtitle}
                        >
                            Your profile is ready. Let&apos;s connect with your partner.
                        </Text>
                        {error !== null && (
                            <View className="flex-row items-center bg-errorBg mx-5 mb-sm rounded-sm px-lg py-sm gap-sm">
                                <Ionicons name="alert-circle" size={16} color={colors.error} />
                                <Text className="flex-1 text-sm font-medium text-error">{error}</Text>
                            </View>
                        )}
                        <GradientButton
                            label={isLoading ? 'Starting pairing…' : "Let's Go!"}
                            onPress={() => { void startPairing(); }}
                            size="lg"
                            fullWidth
                            loading={isLoading}
                        />
                    </View>
                    <DevMenu
                        visible={isDevMenuVisible}
                        onClose={() => setIsDevMenuVisible(false)}
                        onSignOut={() => { void handleDevSignOut(); }}
                    />
                </SafeAreaView>
            </LinearGradient>
        );
    }

    // ── Main chat UI ───────────────────────────────────────────────────────────
    return (
        <ChatContainer
            messages={chatMessages}
            isLoading={isLoading || showTyping}
            mode="single"
            isCoupled={false}
            onModeChange={() => undefined}
            title="CoupleGoAI"
            titleEmoji="💕"
            userAvatar={userAvatar}
            userName={userName}
            footerSlot={footerSlot}
            inputPlaceholder={hasActivePicker ? 'Choose a date above ↑' : 'Type your answer…'}
            inputDisabled={hasActivePicker}
            onSend={handleSend}
            error={error}
        />
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    flex: { flex: 1 },
    emoji: { fontSize: 24 },
    completionEmoji: { fontSize: 64 },
    serifFont: {
        fontFamily: fontFamilies.serifBold,
        letterSpacing: letterSpacing.tight,
    },
    completionSubtitle: { maxWidth: 280 },
});
