import { cn } from '../../lib/utils';
import { Switch as NativeSwitch } from 'react-native';
import React from 'react';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

const Switch = React.forwardRef<any, SwitchProps>(({
  checked = false,
  onCheckedChange,
  disabled = false,
  className,
  ...props
}, ref) => {
  return (
    <NativeSwitch
      ref={ref}
      value={checked}
      onValueChange={onCheckedChange}
      disabled={disabled}
      trackColor={{ false: 'rgba(156, 163, 175, 0.2)', true: 'rgb(59, 130, 246)' }}
      thumbColor={checked ? 'rgb(255, 255, 255)' : 'rgb(255, 255, 255)'}
      ios_backgroundColor="rgba(156, 163, 175, 0.2)"
      style={{
        transform: [{ scale: 0.8 }],
      }}
      {...props}
    />
  );
});

Switch.displayName = 'Switch';

export { Switch };
