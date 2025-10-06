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
      trackColor={{ false: '#f4f4f5', true: '#3b82f6' }}
      thumbColor={checked ? '#ffffff' : '#ffffff'}
      ios_backgroundColor="#f4f4f5"
      style={{
        transform: [{ scale: 0.8 }],
      }}
      {...props}
    />
  );
});

Switch.displayName = 'Switch';

export { Switch };
