/// <reference types="nativewind/types" />
/// <reference types="expo-location" />
/// <reference types="expo-camera" />
/// <reference types="react-native-webview" />

// Allow CSS side-effect imports (e.g. import './global.css')
declare module '*.css' {
  const content: undefined;
  export default content;
}
