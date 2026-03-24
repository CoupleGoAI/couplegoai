import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { ChatMessage } from '@/types/index';
import { colors, gradients, radii, spacing, fontFamilies, fontSize, fontWeight, shadows } from '@/theme/tokens';

interface MessageBubbleProps {
    message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message }) => {
    const isUser = message.role === 'user';

    return (
        <Animated.View
            entering={FadeInUp.duration(260).springify()}
            style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAssistant]}
        >
            {isUser ? (
                <LinearGradient
                    colors={gradients.brand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.bubble, styles.bubbleUser]}
                >
                    <Text style={styles.textUser}>{message.text}</Text>
                </LinearGradient>
            ) : (
                <View style={[styles.bubble, styles.bubbleAssistant]}>
                    <Text style={styles.textAssistant}>{message.text}</Text>
                </View>
            )}
        </Animated.View>
    );
});

MessageBubble.displayName = 'MessageBubble';

const styles = StyleSheet.create({
    wrapper: {
        marginVertical: spacing.xs,
        marginHorizontal: spacing.lg,
    },
    wrapperUser: { alignItems: 'flex-end' },
    wrapperAssistant: { alignItems: 'flex-start' },
    bubble: {
        maxWidth: '78%',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radii.radiusMd,
    },
    bubbleUser: {
        borderBottomRightRadius: spacing.xs,
        ...shadows.glowPrimary,
    },
    bubbleAssistant: {
        backgroundColor: colors.accentSoft,
        borderBottomLeftRadius: spacing.xs,
    },
    textUser: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.base,
        fontWeight: fontWeight.regular,
        color: colors.white,
        lineHeight: fontSize.base * 1.5,
    },
    textAssistant: {
        fontFamily: fontFamilies.sans,
        fontSize: fontSize.base,
        fontWeight: fontWeight.regular,
        color: colors.foreground,
        lineHeight: fontSize.base * 1.5,
    },
});
