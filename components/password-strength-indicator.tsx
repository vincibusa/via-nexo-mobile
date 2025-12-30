import * as React from 'react';
import { View } from 'react-native';
import { Text } from './ui/text';
import { cn } from '../lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

type StrengthLevel = 'weak' | 'medium' | 'strong';

interface StrengthConfig {
  level: StrengthLevel;
  label: string;
  color: string;
  bgColor: string;
  width: string;
}

function calculatePasswordStrength(password: string): StrengthConfig {
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);

  const score = [hasMinLength, hasNumber, hasSpecialChar, hasUppercase, hasLowercase].filter(Boolean).length;

  if (score <= 2) {
    return {
      level: 'weak',
      label: 'Debole',
      color: 'text-red-500',
      bgColor: 'bg-red-500',
      width: 'w-1/3',
    };
  }

  if (score <= 3) {
    return {
      level: 'medium',
      label: 'Media',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500',
      width: 'w-2/3',
    };
  }

  return {
    level: 'strong',
    label: 'Forte',
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    width: 'w-full',
  };
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = calculatePasswordStrength(password);

  return (
    <View className="gap-1.5 mt-1">
      <View className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <View
          className={cn(
            'h-full rounded-full transition-all duration-300',
            strength.bgColor,
            strength.width
          )}
        />
      </View>
      <Text className={cn('text-xs', strength.color)}>
        Sicurezza: {strength.label}
      </Text>
    </View>
  );
}
