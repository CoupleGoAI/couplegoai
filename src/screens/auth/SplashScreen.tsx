import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, palette } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

export default function SplashScreen() {
  return (
    <LinearGradient
      colors={gradients.heroWash}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>💕</Text>
        <Text style={styles.appName}>CoupleGoAI</Text>
        <ActivityIndicator
          size="small"
          color={palette.pink500}
          style={styles.spinner}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['4'],
  },
  emoji: { fontSize: 64 },
  appName: {
    ...textStyles.displaySm,
    color: palette.purple900,
  },
  spinner: {
    marginTop: spacing['4'],
  },
});
