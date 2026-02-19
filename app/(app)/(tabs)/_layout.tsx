import { NativeTabs, Label, Icon, Badge } from 'expo-router/unstable-native-tabs';
import { useAuth } from '../../../lib/contexts/auth';
import { useCallback, useEffect, useState, createContext, useContext } from 'react';
import MessagingService from '../../../lib/services/messaging';

// Modal context for HomeOverlay
interface ModalContextType {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType>({
  isModalOpen: false,
  setIsModalOpen: () => {},
});

export const useModalContext = () => useContext(ModalContext);

export default function TabLayout() {
  const { session } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadUnreadCount = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      const count = await MessagingService.getTotalUnreadCount();
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
      <NativeTabs>
        <NativeTabs.Trigger name="search" role="search">
          <Label>Cerca</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="index">
          <Label>Home</Label>
          <Icon sf="house.fill" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="discovery">
          <Label>Discovery</Label>
          <Icon sf="play.square" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="messages">
          <Label>Messaggi</Label>
          <Icon sf="message" />
          {unreadMessages > 0 && (
            <Badge>{String(unreadMessages)}</Badge>
          )}
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="profile">
          <Label>Profilo</Label>
          <Icon sf="person" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </ModalContext.Provider>
  );
}
