import { View, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '../../components/ui/text';
import { Button } from '../../components/ui/button';
import { X, Calendar, MapPin, Ticket } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { THEME } from '../../lib/theme';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

interface ChatBookingConfirmationProps {
  visible: boolean;
  event: {
    id: string;
    title: string;
    place: {
      name: string;
      address: string;
      city: string;
    };
    start_datetime?: string;
    cover_image?: string;
  } | null;
  bookingState: 'selected' | 'confirming' | 'confirmed';
  onConfirm: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export function ChatBookingConfirmation({
  visible,
  event,
  bookingState,
  onConfirm,
  onCancel,
  onClose,
}: ChatBookingConfirmationProps) {
  const { colorScheme } = useColorScheme();
  const themeColors = THEME[colorScheme === 'dark' ? 'dark' : 'light'];

  if (!event) return null;

  // Format event date if available
  const eventDate = event.start_datetime
    ? new Date(event.start_datetime).toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        onPress={bookingState === 'confirmed' ? onClose : onCancel}
        className="flex-1 bg-black/50 justify-center items-center px-4"
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          className="w-full"
        >
          {/* Modal Content */}
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.View
              entering={SlideInDown.duration(300).springify()}
              className="bg-card rounded-3xl border-2 border-border shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <View className="bg-primary/10 border-b-2 border-primary/20 px-6 py-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <Ticket size={24} color={themeColors.primary} />
                  <Text className="text-lg font-bold text-foreground">
                    {bookingState === 'confirmed'
                      ? 'Prenotazione Confermata!'
                      : 'Conferma Prenotazione'}
                  </Text>
                </View>
                <Pressable
                  onPress={bookingState === 'confirmed' ? onClose : onCancel}
                  className="h-10 w-10 items-center justify-center rounded-full bg-muted/50 active:bg-muted"
                >
                  <X size={20} color={themeColors.foreground} />
                </Pressable>
              </View>

              {/* Event Details */}
              <View className="p-6 gap-4">
                {/* Event Title */}
                <View className="gap-2">
                  <Text className="text-sm font-medium text-muted-foreground">
                    Evento
                  </Text>
                  <Text className="text-xl font-bold text-foreground">
                    {event.title}
                  </Text>
                </View>

                {/* Event Date */}
                {eventDate && (
                  <View className="flex-row items-start gap-3">
                    <Calendar size={20} color={themeColors.primary} className="mt-0.5" />
                    <View className="flex-1 gap-1">
                      <Text className="text-sm font-medium text-muted-foreground">
                        Data e Ora
                      </Text>
                      <Text className="text-base text-foreground capitalize">
                        {eventDate}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Event Location */}
                <View className="flex-row items-start gap-3">
                  <MapPin size={20} color={themeColors.primary} className="mt-0.5" />
                  <View className="flex-1 gap-1">
                    <Text className="text-sm font-medium text-muted-foreground">
                      Luogo
                    </Text>
                    <Text className="text-base font-semibold text-foreground">
                      {event.place.name}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {event.place.address}, {event.place.city}
                    </Text>
                  </View>
                </View>

                {/* Success Message */}
                {bookingState === 'confirmed' && (
                  <View className="mt-2 rounded-2xl bg-green-500/10 border-2 border-green-500/30 p-4">
                    <Text className="text-center text-base font-medium text-green-700 dark:text-green-400">
                      La prenotazione è stata confermata con successo!
                    </Text>
                    <Text className="text-center text-sm text-muted-foreground mt-2">
                      Troverai tutti i dettagli nella schermata evento, dove potrai anche
                      aggiungere ospiti e visualizzare il QR code per l'ingresso.
                    </Text>
                  </View>
                )}

                {/* Info Box */}
                {bookingState !== 'confirmed' && (
                  <View className="mt-2 rounded-2xl bg-primary/10 border-2 border-primary/20 p-4">
                    <Text className="text-center text-sm text-muted-foreground">
                      La prenotazione verrà effettuata a tuo nome. Potrai aggiungere ospiti
                      successivamente dalla schermata dell'evento.
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View className="flex-row gap-3 mt-2">
                  {bookingState === 'selected' && (
                    <>
                      <Button
                        onPress={onCancel}
                        variant="outline"
                        className="flex-1 h-14"
                      >
                        <Text className="font-bold text-foreground">Annulla</Text>
                      </Button>
                      <Button
                        onPress={onConfirm}
                        className="flex-1 h-14 bg-primary"
                      >
                        <Text className="font-bold text-primary-foreground">
                          Conferma Prenotazione
                        </Text>
                      </Button>
                    </>
                  )}

                  {bookingState === 'confirming' && (
                    <View className="flex-1 h-14 bg-primary/20 rounded-xl items-center justify-center">
                      <ActivityIndicator size="small" color={themeColors.primary} />
                      <Text className="text-sm text-muted-foreground mt-2">
                        Creazione prenotazione...
                      </Text>
                    </View>
                  )}

                  {bookingState === 'confirmed' && (
                    <Button
                      onPress={onClose}
                      className="flex-1 h-14 bg-primary"
                    >
                      <Text className="font-bold text-primary-foreground">Chiudi</Text>
                    </Button>
                  )}
                </View>
              </View>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
