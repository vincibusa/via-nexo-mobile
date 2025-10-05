import { Text } from '../../components/ui/text';
import { useState } from 'react';
import { View, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableTextProps {
  text: string;
  numberOfLines?: number;
  className?: string;
}

export function ExpandableText({ text, numberOfLines = 3, className = '' }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const onTextLayout = (e: any) => {
    if (e.nativeEvent.lines.length > numberOfLines && !expanded) {
      setShouldShowButton(true);
    }
  };

  return (
    <View>
      <Text
        className={`text-sm leading-relaxed text-foreground ${className}`}
        numberOfLines={expanded ? undefined : numberOfLines}
        onTextLayout={onTextLayout}
      >
        {text}
      </Text>
      {shouldShowButton && (
        <Pressable onPress={toggleExpanded} className="mt-2">
          <Text className="text-sm font-semibold text-primary">
            {expanded ? 'Mostra meno' : 'Leggi di più'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
