import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@navigation/types';
import { useAppStore } from '@store/appStore';
import { useAuthStore } from '@store/authStore';
import { useAuth } from '@hooks/useAuth';
import AuthNavigator from '@navigation/AuthNavigator';
import OnboardingNavigator from '@navigation/OnboardingNavigator';
import TabNavigator from '@navigation/TabNavigator';
import SplashScreen from '@screens/auth/SplashScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onboardingCompleted = useAppStore((s) => s.onboardingCompleted);
  const { initialize } = useAuth();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (!isInitialized) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !onboardingCompleted ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
