import { LogBox } from 'react-native';

// Must be imported as the very first side-effect in App.tsx, before
// react-native-gesture-handler and other libs that trigger this warning.
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

const originalWarn = console.warn;

console.warn = (...args: unknown[]): void => {
  const firstArg = typeof args[0] === 'string' ? args[0] : '';

  if (firstArg.includes('SafeAreaView has been deprecated')) {
    return;
  }

  originalWarn(...args);
};
