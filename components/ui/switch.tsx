import { cn } from '../../lib/utils';
import { Switch as NativeSwitch } from 'react-native';
import React from 'react';
import { useColorScheme } from 'nativewind';
import { useSettings } from '../../lib/contexts/settings';
import { THEME } from '../../lib/theme';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

// Helper to convert HSL to RGB for React Native Switch
const hslToRgb = (h: number, s: number, l: number): string => {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `rgb(${r}, ${g}, ${b})`;
};

// Parse HSL string like "hsl(321 100% 54%)" to RGB
const parseHslToRgb = (hsl: string): string => {
  const match = hsl.match(/hsl\((\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\)/);
  if (!match) return 'rgb(255, 255, 255)';
  const h = parseFloat(match[1]);
  const s = parseFloat(match[2]);
  const l = parseFloat(match[3]);
  return hslToRgb(h, s, l);
};

const Switch = React.forwardRef<any, SwitchProps>(({
  checked = false,
  onCheckedChange,
  disabled = false,
  className,
  ...props
}, ref) => {
  const { colorScheme } = useColorScheme();
  const { settings } = useSettings();
  
  // Get effective theme
  const effectiveTheme = settings?.theme === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : (settings?.theme === 'dark' ? 'dark' : 'light');
  
  const themeColors = THEME[effectiveTheme];
  
  // Convert theme colors to RGB for React Native Switch
  const primaryRgb = parseHslToRgb(themeColors.primary);
  const mutedRgb = parseHslToRgb(themeColors.muted);
  const mutedRgba = mutedRgb.replace('rgb', 'rgba').replace(')', ', 0.2)');
  
  return (
    <NativeSwitch
      ref={ref}
      value={checked}
      onValueChange={onCheckedChange}
      disabled={disabled}
      trackColor={{ false: mutedRgba, true: primaryRgb }}
      thumbColor="rgb(255, 255, 255)"
      ios_backgroundColor={mutedRgba}
      style={{
        transform: [{ scale: 0.8 }],
      }}
      {...props}
    />
  );
});

Switch.displayName = 'Switch';

export { Switch };
