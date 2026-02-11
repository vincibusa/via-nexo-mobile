import React, { useCallback, useEffect, useMemo, useState, createContext, useContext } from 'react';
import { Tabs } from 'expo-router';
import { Home, MessageCircle, Play, Search, User } from 'lucide-react-native';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '../../../components/glass';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  SharedValue,
  Extrapolation,
} from 'react-native-reanimated';
import { NAV_THEME } from '../../../lib/theme';
import MessagingService from '../../../lib/services/messaging';
import { useAuth } from '../../../lib/contexts/auth';

type TabRouteName = 'index' | 'search' | 'discovery' | 'messages' | 'profile';

const TAB_LABELS: Record<TabRouteName, string> = {
  index: 'Home',
  search: 'Cerca',
  discovery: 'Discovery',
  messages: 'Messaggi',
  profile: 'Profilo',
};

const MAIN_ROUTES: TabRouteName[] = ['index', 'discovery', 'messages', 'profile'];
const ACTIVE_COLOR = '#4DA7FF';
const INACTIVE_COLOR = 'rgba(255, 255, 255, 0.55)';
const CAPSULE_HORIZONTAL_PADDING = 10;
const CAPSULE_VERTICAL_PADDING = 8;
const SCRUB_HAPTIC_COOLDOWN = 60;

// Context to track modal state for dimming bottom bar
interface ModalContextType {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType>({
  isModalOpen: false,
  setIsModalOpen: () => {},
});

export const useModalContext = () => useContext(ModalContext);

// iOS-style spring configuration
const APPLE_SPRING_CONFIG = {
  mass: 1,
  damping: 16,
  stiffness: 250,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};


// Animated icon component
function AnimatedTabIcon({
  routeName,
  focused,
  unreadMessages,
  pressed,
}: {
  routeName: TabRouteName;
  focused: boolean;
  unreadMessages: number;
  pressed: SharedValue<number>;
}) {
  const size = 22;
  const strokeInactive = 1.9;
  const strokeActive = 2.2;

  const animatedIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pressed.value,
      [0, 1],
      [1, 0.85],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [{ scale }],
    };
  });

  const getIcon = () => {
    const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
    const stroke = focused ? strokeActive : strokeInactive;

    switch (routeName) {
      case 'index':
        return <Home size={size} color={color} strokeWidth={stroke} />;
      case 'discovery':
        return <Play size={size} color={color} strokeWidth={stroke} fill={focused ? ACTIVE_COLOR : 'transparent'} />;
      case 'messages':
        return <MessageCircle size={size} color={color} strokeWidth={stroke} />;
      case 'profile':
        return <User size={size} color={color} strokeWidth={stroke} />;
      default:
        return <Search size={size} color={color} strokeWidth={stroke} />;
    }
  };

  return (
    <View style={styles.iconWrapper}>
      <Animated.View style={animatedIconStyle}>
        {getIcon()}
      </Animated.View>
      {routeName === 'messages' && unreadMessages > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadMessages > 99 ? '99+' : unreadMessages}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// Individual tab item
function TabItem({
  route,
  index,
  focused,
  visualFocused,
  slotWidth,
  unreadMessages,
  onPress,
  label,
}: {
  route: { key: string; name: string; params?: object };
  index: number;
  focused: boolean;
  visualFocused: boolean;
  slotWidth: number;
  unreadMessages: number;
  onPress: (route: { key: string; name: string; params?: object }) => void;
  label: string;
}) {
  const pressed = useSharedValue(0);
  const routeName = route.name as TabRouteName;

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .onBegin(() => {
          pressed.set(withTiming(1, { duration: 80 }));
        })
        .onFinalize(() => {
          pressed.set(withTiming(0, { duration: 250 }));
        })
        .onEnd(() => {
          runOnJS(onPress)(route);
        }),
    [onPress, route, pressed]
  );

  const labelStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      pressed.value,
      [0, 1],
      [1, 0.95],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      color: visualFocused ? ACTIVE_COLOR : INACTIVE_COLOR,
      opacity: interpolate(
        pressed.value,
        [0, 1],
        [1, 0.7],
        Extrapolation.CLAMP
      ),
    };
  });

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          styles.mainItem,
          { width: slotWidth },
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: focused }}
      >
        <AnimatedTabIcon
          routeName={routeName}
          focused={visualFocused}
          unreadMessages={unreadMessages}
          pressed={pressed}
        />
        <Animated.Text style={[styles.mainItemLabel, labelStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </GestureDetector>
  );
}

// Main tab bar component
function AppleLiquidTabBar({
  state,
  descriptors,
  navigation,
  unreadMessages,
  isDimmed,
}: BottomTabBarProps & {
  unreadMessages: number;
  isDimmed: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [capsuleWidth, setCapsuleWidth] = useState(0);
  const [containerLayout, setContainerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const indicatorScale = useSharedValue(1);
  const currentIndex = useSharedValue(0);
  const isScrubbing = useSharedValue(false);
  const scrubIndex = useSharedValue(0);
  const lastHapticIndex = useSharedValue(-1);
  const lastHapticTime = useSharedValue(0);

  const routesByName = useMemo(
    () => Object.fromEntries(state.routes.map((route) => [route.name, route])),
    [state.routes]
  );

  const searchRoute = routesByName.search;
  const mainRoutes = MAIN_ROUTES.map((name) => routesByName[name]).filter(Boolean);
  const bottomOffset = insets.bottom + 8;
  
  const isRouteFocused = useCallback(
    (routeKey: string) => state.routes[state.index]?.key === routeKey,
    [state.routes, state.index]
  );

  const activeMainIndex = Math.max(
    0,
    mainRoutes.findIndex((route) => isRouteFocused(route.key))
  );

  const slots = mainRoutes.length || 1;
  const innerWidth = Math.max(0, capsuleWidth - CAPSULE_HORIZONTAL_PADDING * 2);
  const slotWidth = innerWidth / slots;
  const canScrub = capsuleWidth > 0 && mainRoutes.length > 0;

  const triggerHaptic = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    Haptics.impactAsync(style).catch(() => {});
  }, []);

  useEffect(() => {
    if (!canScrub || isScrubbing.value) return;

    indicatorX.value = withSpring(
      activeMainIndex * slotWidth,
      APPLE_SPRING_CONFIG
    );
    currentIndex.value = activeMainIndex;
    scrubIndex.value = activeMainIndex;
    lastHapticIndex.value = activeMainIndex;

    indicatorScale.value = withTiming(1.02, { duration: 100 }, () => {
      indicatorScale.value = withTiming(1, { duration: 180 });
    });
  }, [activeMainIndex, slotWidth, canScrub, indicatorX, currentIndex, scrubIndex, lastHapticIndex, isScrubbing, indicatorScale]);

  useEffect(() => {
    if (canScrub) {
      indicatorWidth.value = withSpring(slotWidth * 0.88, APPLE_SPRING_CONFIG);
    }
  }, [slotWidth, canScrub, indicatorWidth]);

  const handlePress = useCallback(
    (route: { key: string; name: string; params?: object }) => {
      const focused = isRouteFocused(route.key);
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!focused && !event.defaultPrevented) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate(route.name as never, route.params as never);
      }
    },
    [isRouteFocused, navigation, triggerHaptic]
  );

  const getIndexFromX = useCallback((x: number): number => {
    'worklet';
    if (!canScrub || slotWidth <= 0) return activeMainIndex;
    
    const relativeX = x - containerLayout.x - CAPSULE_HORIZONTAL_PADDING;
    const rawIndex = Math.floor(relativeX / slotWidth);
    return Math.max(0, Math.min(mainRoutes.length - 1, rawIndex));
  }, [canScrub, slotWidth, activeMainIndex, containerLayout.x, mainRoutes.length]);

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .minDistance(4)
      .onBegin((event) => {
        'worklet';
        isScrubbing.value = true;
        const index = getIndexFromX(event.absoluteX);
        scrubIndex.value = index;
        lastHapticIndex.value = index;
        lastHapticTime.value = Date.now();
        
        const targetX = index * slotWidth;
        indicatorX.value = withTiming(targetX, { duration: 60 });
        
        runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Light);
      })
      .onChange((event) => {
        'worklet';
        const index = getIndexFromX(event.absoluteX);
        
        if (index !== scrubIndex.value) {
          scrubIndex.value = index;
          
          const now = Date.now();
          if (index !== lastHapticIndex.value && now - lastHapticTime.value > SCRUB_HAPTIC_COOLDOWN) {
            lastHapticIndex.value = index;
            lastHapticTime.value = now;
            runOnJS(triggerHaptic)(Haptics.ImpactFeedbackStyle.Soft);
          }
        }
        
        const targetX = index * slotWidth;
        indicatorX.value = withTiming(targetX, { duration: 50 });
      })
      .onEnd(() => {
        'worklet';
        const targetIndex = Math.round(scrubIndex.value);
        runOnJS(handlePress)(mainRoutes[targetIndex]);
      })
      .onFinalize(() => {
        'worklet';
        isScrubbing.value = false;
        const finalIndex = Math.round(scrubIndex.value);
        indicatorX.value = withSpring(
          finalIndex * slotWidth,
          APPLE_SPRING_CONFIG
        );
      });
  }, [canScrub, slotWidth, activeMainIndex, containerLayout.x, mainRoutes, handlePress, triggerHaptic, isScrubbing, scrubIndex, lastHapticIndex, lastHapticTime, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      width: indicatorWidth.value,
      transform: [
        { translateX: indicatorX.value },
        { scale: indicatorScale.value },
      ],
      opacity: canScrub ? 1 : 0,
    };
  });

  const searchPressed = useSharedValue(0);
  const searchTap = useMemo(
    () =>
      Gesture.Tap()
        .onBegin(() => {
          searchPressed.set(withTiming(1, { duration: 80 }));
        })
        .onFinalize(() => {
          searchPressed.set(withTiming(0, { duration: 250 }));
        })
        .onEnd(() => {
          if (searchRoute) {
            runOnJS(handlePress)(searchRoute);
          }
        }),
    [searchRoute, handlePress, searchPressed]
  );

  const searchIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      searchPressed.value,
      [0, 1],
      [1, 0.85],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
    };
  });

  return (
    <View pointerEvents="box-none" style={[styles.barRoot, { bottom: bottomOffset }]}>
      {/* Search Orb */}
      {searchRoute ? (
        <GlassSurface
          variant="bar"
          dimmed={isDimmed}
          style={[styles.searchOrb, styles.searchSpacing]}
        >
          <GestureDetector gesture={searchTap}>
            <Animated.View
              style={[
                styles.searchPressable,
                isRouteFocused(searchRoute.key) && styles.searchPressableFocused,
              ]}
            >
              <Animated.View style={searchIconStyle}>
                <Search
                  size={24}
                  color={isRouteFocused(searchRoute.key) ? ACTIVE_COLOR : INACTIVE_COLOR}
                  strokeWidth={isRouteFocused(searchRoute.key) ? 2.2 : 1.9}
                />
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </GlassSurface>
      ) : null}

      {/* Main Tab Capsule */}
      <GestureDetector gesture={panGesture}>
        <GlassSurface
          variant="bar"
          dimmed={isDimmed}
          style={styles.mainCapsule}
        >
          <View
            style={styles.mainCapsuleInner}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              setCapsuleWidth((current) =>
                Math.abs(current - width) < 1 ? current : width
              );
              
              event.target.measureInWindow((x, y, w, h) => {
                setContainerLayout({ x, y, width: w, height: h });
              });
            }}
          >
            {/* Animated Focus Indicator */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.focusPill,
                indicatorStyle,
                { left: CAPSULE_HORIZONTAL_PADDING + slotWidth * 0.06 },
              ]}
            />

            {/* Tab Items */}
            {mainRoutes.map((route, index) => {
              const routeName = route.name as TabRouteName;
              const focused = isRouteFocused(route.key);
              const options = descriptors[route.key]?.options;
              const label =
                (typeof options?.title === 'string' && options.title) ||
                TAB_LABELS[routeName];

              const visualFocused = isScrubbing.value 
                ? Math.round(scrubIndex.value) === index
                : index === activeMainIndex;

              return (
                <TabItem
                  key={route.key}
                  route={route}
                  index={index}
                  focused={focused}
                  visualFocused={visualFocused}
                  slotWidth={slotWidth}
                  unreadMessages={unreadMessages}
                  onPress={handlePress}
                  label={label}
                />
              );
            })}
          </View>
        </GlassSurface>
      </GestureDetector>
    </View>
  );
}

export default function TabLayout() {
  const { session } = useAuth();
  const theme = NAV_THEME.dark;
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  

  const loadUnreadCount = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      const messagingService = MessagingService;
      const count = await messagingService.getTotalUnreadCount();
      setUnreadMessages(count);
    } catch (error) {
      console.error('Error loading unread messages:', error);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  return (
    <ModalContext.Provider value={{ isModalOpen, setIsModalOpen }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          sceneStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
        tabBar={(props) => (
          <AppleLiquidTabBar
            {...props}
            unreadMessages={unreadMessages}
            isDimmed={isModalOpen}
          />
        )}
      >
        <Tabs.Screen name="index" options={{ title: TAB_LABELS.index }} />
        <Tabs.Screen name="search" options={{ title: TAB_LABELS.search }} />
        <Tabs.Screen name="discovery" options={{ title: TAB_LABELS.discovery }} />
        <Tabs.Screen name="messages" options={{ title: TAB_LABELS.messages }} />
        <Tabs.Screen name="profile" options={{ title: TAB_LABELS.profile }} />
      </Tabs>
    </ModalContext.Provider>
  );
}

const styles = StyleSheet.create({
  barRoot: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  searchSpacing: {
    marginRight: 10,
  },
  searchOrb: {
    width: 72,
    height: 72,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchPressable: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchPressableFocused: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  mainCapsule: {
    flex: 1,
    maxWidth: 340,
    height: 72,
    borderRadius: 999,
    overflow: 'hidden',
  },
  mainCapsuleInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CAPSULE_HORIZONTAL_PADDING,
    paddingVertical: CAPSULE_VERTICAL_PADDING,
    position: 'relative',
  },
  focusPill: {
    position: 'absolute',
    top: CAPSULE_VERTICAL_PADDING,
    bottom: CAPSULE_VERTICAL_PADDING,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  mainItem: {
    height: 56,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 4,
  },
  mainItemLabel: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 12,
    color: INACTIVE_COLOR,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4D5A',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 10,
  },
});
