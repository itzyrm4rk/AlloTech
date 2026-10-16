import { cssInterop } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

// Permet à NativeWind de styliser correctement SafeAreaView
cssInterop(SafeAreaView, {
  className: 'style',
});
