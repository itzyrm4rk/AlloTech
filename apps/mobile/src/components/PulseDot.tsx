import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface PulseDotProps {
  color?: string;
  size?: number;
}

/**
 * Indicateur visuel à pulsation fluide 60fps basé sur l'API native React Native Animated.
 * Évite tout recours à react-native-reanimated / worklets CSS (animate-pulse) pour garantir
 * 0 crash sur mobile (résout l'erreur makeMutable of undefined).
 */
export function PulseDot({ color = '#F59E0B', size = 8 }: PulseDotProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.15,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.35,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.85,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [opacity, scale]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}
