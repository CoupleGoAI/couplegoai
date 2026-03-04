/**
 * CoupleGoAI — Color Tokens (re-export)
 *
 * All canonical colors live in `tokens.ts`.
 * This file re-exports them for backward compatibility.
 * Do NOT add new color values here — add them to tokens.ts.
 *
 * New UI must use NativeWind className with semantic names:
 *   bg-background, text-foreground, bg-primary, etc.
 */
import { colors, gradients as tokenGradients } from './tokens';

// Re-export canonical semantic colors
export const semanticColors = colors;

// Re-export canonical gradients + derived legacy gradients
export const gradients = {
  ...tokenGradients,
  /** Soft wash background: accentSoft → muted → background */
  heroWash: [colors.accentSoft, colors.muted, colors.background] as [string, string, string],
  /** Warm card backdrop: muted → accentSoft */
  cardWarm: [colors.muted, colors.accentSoft] as [string, string],
  /** CTA panel: primary → accent */
  ctaPanel: [colors.primary, colors.accent] as [string, string],
  /** Dark overlay for images */
  darkOverlay: ['rgba(30,18,48,0)', 'rgba(30,18,48,0.7)'] as [string, string],
};

/**
 * Legacy palette — maps old names to token values.
 * Consumers should migrate to NativeWind or import from tokens.ts directly.
 * TODO: Remove once all consumers use semantic tokens.
 */
export const palette = {
  // Pinks → primary spectrum
  pink50: colors.muted,
  pink100: colors.muted,
  pink200: colors.primaryLight,
  pink300: colors.primaryLight,
  pink400: colors.primary,
  pink500: colors.primary,
  pink600: colors.primary,

  // Lavender → accent spectrum
  lavender50: colors.accentSoft,
  lavender100: colors.accentSoft,
  lavender200: colors.accentSoft,
  lavender300: colors.accentLight,
  lavender400: colors.accent,
  lavender500: colors.accent,
  lavender600: colors.accent,
  lavender700: colors.foregroundMuted,

  // Deep purple → foreground
  purple900: colors.foreground,
  purple800: colors.foreground,
  purple700: colors.foregroundMuted,

  // Neutrals
  white: colors.background,
  gray50: colors.background,
  gray100: colors.muted,
  gray200: colors.borderDefault,
  gray300: colors.borderDefault,
  gray400: colors.gray,
  gray500: colors.gray,
  gray600: colors.foregroundMuted,
  gray700: colors.foregroundMuted,
  gray800: colors.foreground,
  gray900: colors.foreground,
  black: colors.black,

  // Functional
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  errorBg: colors.errorBg,
  info: colors.info,

  // Utility
  transparent: colors.transparent,
} as const;

/**
 * Legacy light scheme — maps old names to token values.
 * TODO: Remove once all screens use NativeWind semantic classes.
 */
export const light = {
  bgPrimary: colors.background,
  bgSecondary: colors.background,
  bgCard: colors.background,
  bgMuted: colors.muted,
  bgOverlay: 'rgba(254, 240, 244, 0.85)',

  textPrimary: colors.foreground,
  textSecondary: colors.foregroundMuted,
  textMuted: colors.gray,
  textInverse: colors.background,
  textAccent: colors.primary,

  brandPrimary: colors.primary,
  brandSecondary: colors.accent,
  brandLight: colors.primaryLight,

  borderLight: colors.borderDefault,
  borderMedium: colors.borderDefault,
  borderFocus: colors.primary,

  primaryBtn: colors.primary,
  primaryBtnText: colors.background,
  secondaryBtn: colors.accentSoft,
  secondaryBtnText: colors.foregroundMuted,

  online: colors.success,
  offline: colors.gray,
  streak: colors.warning,
} as const;

export type ColorTheme = typeof light;
