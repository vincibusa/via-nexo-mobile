import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/text';
import { Sparkles } from 'lucide-react-native';

interface MatchBadgeProps {
  score: number; // 0-2 range from backend
  size?: 'sm' | 'md' | 'lg';
}

export function MatchBadge({ score, size = 'md' }: MatchBadgeProps) {
  // Convert score (0-2) to percentage (0-100)
  const percentage = Math.round(Math.min(100, Math.max(0, score * 50)));

  // Determine color based on percentage
  const getColorClass = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return { container: 'px-2 py-1', text: 'text-xs', icon: 12 };
      case 'lg':
        return { container: 'px-4 py-2', text: 'text-lg', icon: 20 };
      default:
        return { container: 'px-3 py-1.5', text: 'text-sm', icon: 16 };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <View
      className={`flex-row items-center rounded-full ${getColorClass()} ${sizeClasses.container}`}
    >
      <Sparkles size={sizeClasses.icon} color="white" />
      <Text className={`ml-1 font-bold text-white ${sizeClasses.text}`}>
        {percentage}% match
      </Text>
    </View>
  );
}
