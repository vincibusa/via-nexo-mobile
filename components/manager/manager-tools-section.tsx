/**
 * Manager Tools Section
 * Displays manager-specific actions in the profile screen
 * Only visible when user.role === 'manager'
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, QrCode } from 'lucide-react-native';

export function ManagerToolsSection() {
  const router = useRouter();

  const tools = [
    {
      id: 'events',
      label: 'Gestisci Eventi',
      description: 'Crea e modifica i tuoi eventi',
      icon: Calendar,
      route: '/(app)/manager',
    },
    {
      id: 'scanner',
      label: 'Scanner Check-in',
      description: 'Scansiona QR code per il check-in',
      icon: QrCode,
      route: '/(app)/manager/scanner',
    },
  ];

  return (
    <View className="px-4 pb-4">
      <View className="bg-card rounded-xl p-4 border border-border">
        {/* Section Header */}
        <Text className="text-lg font-semibold text-foreground mb-3">
          Strumenti Manager
        </Text>

        {/* Tool Buttons */}
        <View className="gap-2">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <TouchableOpacity
                key={tool.id}
                onPress={() => router.push(tool.route as any)}
                className="flex-row items-center bg-muted rounded-lg p-3 active:opacity-70"
              >
                {/* Icon */}
                <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
                  <Icon size={20} color="white" />
                </View>

                {/* Label and Description */}
                <View className="flex-1">
                  <Text className="text-foreground font-medium">
                    {tool.label}
                  </Text>
                  <Text className="text-muted-foreground text-sm">
                    {tool.description}
                  </Text>
                </View>

                {/* Arrow */}
                <Text className="text-muted-foreground text-lg">›</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}
