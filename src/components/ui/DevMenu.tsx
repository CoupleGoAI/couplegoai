import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontFamilies, radii, shadows, spacing } from '@/theme/tokens';

interface DevMenuProps {
    visible: boolean;
    onClose: () => void;
    onSignOut: () => void;
}

export const DevMenu: React.FC<DevMenuProps> = ({ visible, onClose, onSignOut }) => (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
            <Pressable style={styles.card} onPress={() => undefined}>
                <Text style={styles.title}>Developer menu</Text>
                <TouchableOpacity style={styles.action} onPress={onSignOut}>
                    <Text style={styles.actionText}>Sign out and clear storage</Text>
                </TouchableOpacity>
            </Pressable>
        </Pressable>
    </Modal>
);

DevMenu.displayName = 'DevMenu';

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(29, 25, 43, 0.16)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    card: {
        width: '100%',
        maxWidth: 320,
        borderRadius: radii.radius,
        padding: spacing.lg,
        gap: spacing.md,
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
        ...shadows.md,
    },
    title: {
        color: colors.foregroundMuted,
        textAlign: 'center',
        fontFamily: fontFamilies.sansBold,
        fontSize: 13,
    },
    action: {
        borderRadius: radii.radiusMd,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.72)',
    },
    actionText: {
        color: colors.error,
        textAlign: 'center',
        fontFamily: fontFamilies.sans,
        fontSize: 15,
    },
});
