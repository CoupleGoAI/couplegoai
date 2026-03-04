/**
 * CoupleGoAI — Design System Entry
 * Single import point for all design tokens.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  STYLING RULES (enforced)                                       │
 * │                                                                  │
 * │  • tokens.ts is the SINGLE SOURCE OF TRUTH for semantic tokens. │
 * │  • No hardcoded hex colors, spacing numbers, or radii in        │
 * │    components — use NativeWind `className` with semantic names.  │
 * │  • StyleSheet.create only for dynamic or NativeWind-unsupported. │
 * │  • New token needed? Add to tokens.ts + tailwind.config.js.     │
 * └──────────────────────────────────────────────────────────────────┘
 */
import { tokens, colors as semanticColors, gradients as tokenGradients, radii as tokenRadii, spacing as tokenSpacing, shadows as tokenShadows, typographyTokens } from './tokens';
import { light, gradients, palette, type ColorTheme } from './colors';
import { fontFamilies, fontSize, fontWeight, lineHeight, letterSpacing, textStyles } from './typography';
import { spacing, radii, shadows, layout, semanticSpacing, semanticRadii } from './spacing';

export const theme = {
  colors: {
    light,
    gradients,
    palette,
  },
  typography: {
    fontFamilies,
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
    textStyles,
  },
  spacing,
  radii,
  shadows,
  layout,
} as const;

export type Theme = typeof theme;
export type { ColorTheme };

// Canonical tokens — preferred for new code
export { tokens, semanticColors, tokenGradients, tokenRadii, tokenSpacing, tokenShadows, typographyTokens };

// Legacy re-exports — backward compatibility for existing consumers
export { light, gradients, palette };
export { fontFamilies, fontSize, fontWeight, lineHeight, letterSpacing, textStyles };
export { spacing, radii, shadows, layout };
