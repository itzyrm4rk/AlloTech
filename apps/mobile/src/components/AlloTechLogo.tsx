import { Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

interface AlloTechLogoProps {
  size?: number;
  showText?: boolean;
  subtitle?: string;
  textColor?: string;
}

export function AlloTechLogo({
  size = 48,
  showText = true,
  subtitle,
  textColor = '#1A2C31',
}: AlloTechLogoProps) {
  return (
    <View className="items-center justify-center">
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Defs>
          {/* Gradient Fond Squircle */}
          <LinearGradient
            id="allotech-mobile-bg"
            x1="4"
            y1="4"
            x2="60"
            y2="60"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#31525B" />
            <Stop offset="0.6" stopColor="#254148" />
            <Stop offset="1" stopColor="#1B3137" />
          </LinearGradient>

          {/* Gradient Or / Ambre */}
          <LinearGradient
            id="allotech-mobile-amber"
            x1="16"
            y1="16"
            x2="48"
            y2="48"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#FFA101" />
            <Stop offset="1" stopColor="#FF7A00" />
          </LinearGradient>

          {/* Gradient Silicon Die */}
          <LinearGradient
            id="allotech-mobile-chip"
            x1="18"
            y1="18"
            x2="46"
            y2="46"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor="#1E383F" />
            <Stop offset="1" stopColor="#15282D" />
          </LinearGradient>
        </Defs>

        {/* 1. Base Squircle */}
        <Rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="16"
          fill="url(#allotech-mobile-bg)"
          stroke="#416974"
          strokeWidth="1.5"
        />

        {/* 2. PINS DU MICROPROCESSEUR (Hardware) */}
        {/* Haut */}
        <Line
          x1="26"
          y1="3"
          x2="26"
          y2="8"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.9}
        />
        <Line
          x1="32"
          y1="3"
          x2="32"
          y2="8"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.9}
        />
        <Line
          x1="38"
          y1="3"
          x2="38"
          y2="8"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.9}
        />

        {/* Bas */}
        <Line
          x1="26"
          y1="56"
          x2="26"
          y2="61"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.9}
        />
        <Line
          x1="32"
          y1="56"
          x2="32"
          y2="61"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.9}
        />
        <Line
          x1="38"
          y1="56"
          x2="38"
          y2="61"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.9}
        />

        {/* Gauche */}
        <Line
          x1="3"
          y1="26"
          x2="8"
          y2="26"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.9}
        />
        <Line
          x1="3"
          y1="32"
          x2="8"
          y2="32"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.9}
        />
        <Line
          x1="3"
          y1="38"
          x2="8"
          y2="38"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.9}
        />

        {/* Droite */}
        <Line
          x1="56"
          y1="26"
          x2="61"
          y2="26"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.9}
        />
        <Line
          x1="56"
          y1="32"
          x2="61"
          y2="32"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.9}
        />
        <Line
          x1="56"
          y1="38"
          x2="61"
          y2="38"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={0.9}
        />

        {/* 3. COEUR SILICIUM */}
        <Rect
          x="12"
          y="12"
          width="40"
          height="40"
          rx="10"
          fill="url(#allotech-mobile-chip)"
          stroke="#416974"
          strokeWidth="1.2"
        />

        {/* Traces de circuit */}
        <Path
          d="M16 20H20V16 M48 20H44V16 M16 44H20V48 M48 44H44V48"
          stroke="#487582"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
        />

        {/* 4. BALISES SOFTWARE < / > */}
        <Path
          d="M26 24L20 32L26 40"
          stroke="url(#allotech-mobile-amber)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Line
          x1="35"
          y1="22"
          x2="29"
          y2="42"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={0.95}
        />
        <Path
          d="M38 24L44 32L38 40"
          stroke="url(#allotech-mobile-amber)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 5. LED D'ÉTAT SYSTÈME */}
        <Circle cx="32" cy="16.5" r="2" fill="#2E8B57" />
        <Circle cx="32" cy="16.5" r="3.5" stroke="#2E8B57" strokeWidth="0.8" opacity={0.5} />
      </Svg>

      {showText && (
        <View className="items-center mt-3">
          <Text className="text-2xl font-black tracking-tight" style={{ color: textColor }}>
            Allo<Text className="text-[#FFA101]">Tech</Text>
          </Text>
          {subtitle && (
            <Text className="text-xs font-medium text-slate-500 mt-1 text-center">{subtitle}</Text>
          )}
        </View>
      )}
    </View>
  );
}
