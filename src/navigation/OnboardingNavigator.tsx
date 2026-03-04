import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { OnboardingStackParamList } from '@navigation/types';
import GenerateQRScreen from '@screens/onboarding/GenerateQRScreen';
import ScanQRScreen from '@screens/onboarding/ScanQRScreen';
import ConnectionConfirmedScreen from '@screens/onboarding/ConnectionConfirmedScreen';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="GenerateQR"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="GenerateQR" component={GenerateQRScreen} />
      <Stack.Screen name="ScanQR" component={ScanQRScreen} />
      <Stack.Screen name="ConnectionConfirmed" component={ConnectionConfirmedScreen} />
    </Stack.Navigator>
  );
}
