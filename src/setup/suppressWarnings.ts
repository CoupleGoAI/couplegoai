import { LogBox } from 'react-native';

// Must be imported as the very first side-effect in App.tsx, before
// react-native-gesture-handler and other libs that trigger this warning.
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);
