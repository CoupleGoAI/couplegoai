import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// --- Auth Stack ---
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// --- Onboarding Stack ---
export type OnboardingStackParamList = {
  GenerateQR: undefined;
  ScanQR: undefined;
  ConnectionConfirmed: undefined;
};

// --- Main Tab ---
export type MainTabParamList = {
  Home: undefined;
  Chat: undefined;
  Game: undefined;
  Profile: undefined;
};

// --- Root Stack ---
export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

// Navigation prop helpers
export type AuthNavProp = NativeStackNavigationProp<AuthStackParamList>;
export type OnboardingNavProp = NativeStackNavigationProp<OnboardingStackParamList>;
export type MainTabNavProp = BottomTabNavigationProp<MainTabParamList>;
export type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

// Auth screen props
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

// Onboarding screen props
export type GenerateQRScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'GenerateQR'>;
export type ScanQRScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'ScanQR'>;
export type ConnectionConfirmedScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'ConnectionConfirmed'>;

// Tab screen props
export type HomeScreenProps = BottomTabScreenProps<MainTabParamList, 'Home'>;
export type ChatScreenProps = BottomTabScreenProps<MainTabParamList, 'Chat'>;
export type GameScreenProps = BottomTabScreenProps<MainTabParamList, 'Game'>;
export type ProfileScreenProps = BottomTabScreenProps<MainTabParamList, 'Profile'>;
