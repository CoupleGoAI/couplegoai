import React, { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { ChatMode } from '@/types/index';
import type { RootNavProp } from '@navigation/types';
import { useAiChat } from '@hooks/useAiChat';
import { ChatContainer } from '@components/ui/Chat';

export function AiChatScreen(): React.ReactElement {
    const navigation = useNavigation<RootNavProp>();
    const { messages, isLoading, error, send } = useAiChat();
    const [mode, setMode] = useState<ChatMode>('single');

    const handleSend = useCallback(
        (text: string) => {
            void send(text);
        },
        [send],
    );

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    return (
        <ChatContainer
            messages={messages}
            isLoading={isLoading}
            mode={mode}
            onModeChange={setMode}
            onSend={handleSend}
            onBack={handleBack}
            error={error}
        />
    );
}
