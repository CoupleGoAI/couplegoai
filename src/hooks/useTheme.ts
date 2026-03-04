import { useColorScheme } from 'react-native';
import { useAppStore } from '../store/appStore';
import { light, gradients, palette } from '../theme/colors';
import { textStyles, fontSize, fontWeight, fontFamilies } from '../theme/typography';
import { spacing, radii, shadows, layout } from '../theme/spacing';

export function useTheme() {
  const systemScheme = useColorScheme();
  const storeScheme = useAppStore((s) => s.colorScheme);
  const scheme = storeScheme ?? systemScheme ?? 'light';
  // TODO: Add dark theme support when tokens.ts has dark mode values
  const colors = light;

  return {
    colors,
    gradients,
    palette,
    textStyles,
    fontSize,
    fontWeight,
    fontFamilies,
    spacing,
    radii,
    shadows,
    layout,
    isDark: scheme === 'dark',
    scheme,
  };
}
