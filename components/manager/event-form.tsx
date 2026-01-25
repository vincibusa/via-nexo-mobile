/**
 * Event Form Component
 * Shared form for creating and editing events with improved UI/UX
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  useColorScheme,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import {
  Calendar,
  MapPin,
  Euro,
  Type,
  FileText,
  Tag,
  Ticket,
  Eye,
  EyeOff,
  Search,
  X,
  Users,
  ImagePlus,
  Music,
  Trash2,
  Plus,
  Clock,
  Video,
  List,
  TicketCheck,
} from 'lucide-react-native';
import { managerService } from '../../lib/services/manager';
import { uploadService } from '../../lib/services/upload';
import { storage } from '../../lib/storage';
import type { EventFormData, ManagerPlace } from '../../lib/types/manager';

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => void;
  isLoading?: boolean;
}

export function EventForm({ initialData, onSubmit, isLoading }: EventFormProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#fff' : '#000';
  const mutedColor = isDark ? '#888' : '#666';

  const [formData, setFormData] = useState<Partial<EventFormData>>(() => {
    // Initialize with initialData if available, otherwise use defaults
    if (initialData && Object.keys(initialData).length > 0) {
      return {
        title: initialData.title || '',
        description: initialData.description || '',
        event_type: initialData.event_type || 'concert',
        start_datetime: initialData.start_datetime || new Date().toISOString(),
        end_datetime: initialData.end_datetime,
        doors_open_time: initialData.doors_open_time,
        place_id: initialData.place_id || '',
        is_published: initialData.is_published ?? false,
        is_listed: initialData.is_listed ?? true,
        cover_image_url: initialData.cover_image_url || '',
        promo_video_url: initialData.promo_video_url || '',
        genre: initialData.genre || [],
        lineup: initialData.lineup || [],
        ticket_url: initialData.ticket_url || '',
        ticket_price_min: initialData.ticket_price_min,
        ticket_price_max: initialData.ticket_price_max,
        tickets_available: initialData.tickets_available ?? true,
        capacity: initialData.capacity,
        lista_nominativa_enabled: initialData.lista_nominativa_enabled ?? false,
        max_guests_per_reservation: initialData.max_guests_per_reservation || 5,
        prive_enabled: initialData.prive_enabled ?? false,
        prive_min_price: initialData.prive_min_price ?? null,
        prive_max_seats: initialData.prive_max_seats ?? 10,
        prive_deposit_required: initialData.prive_deposit_required ?? null,
        prive_total_capacity: initialData.prive_total_capacity ?? 50,
      };
    }
    // Default values for new event
    return {
      title: '',
      description: '',
      event_type: 'concert',
      start_datetime: new Date().toISOString(),
      end_datetime: undefined,
      doors_open_time: undefined,
      place_id: '',
      is_published: false,
      is_listed: true,
      cover_image_url: '',
      promo_video_url: '',
      genre: [],
      lineup: [],
      ticket_url: '',
      ticket_price_min: undefined,
      ticket_price_max: undefined,
      tickets_available: true,
      capacity: undefined,
      lista_nominativa_enabled: false,
      max_guests_per_reservation: 5,
      prive_enabled: false,
      prive_min_price: null,
      prive_max_seats: 10,
      prive_deposit_required: null,
      prive_total_capacity: 50,
    };
  });

  const [places, setPlaces] = useState<ManagerPlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDoorsOpenTimePicker, setShowDoorsOpenTimePicker] = useState(false);
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [placeSearch, setPlaceSearch] = useState('');
  const [newGenreInput, setNewGenreInput] = useState('');
  const [newLineupInput, setNewLineupInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const eventTypes = [
    { value: 'concert', label: 'Concerto', icon: '🎵' },
    { value: 'dj_set', label: 'DJ Set', icon: '🎧' },
    { value: 'theme_night', label: 'Serata a Tema', icon: '🎭' },
    { value: 'private_party', label: 'Festa Privata', icon: '🎉' },
    { value: 'live_music', label: 'Musica Live', icon: '🎸' },
    { value: 'karaoke', label: 'Karaoke', icon: '🎤' },
    { value: 'other', label: 'Altro', icon: '✨' },
  ];

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('[EventForm] Updating form with initialData:', {
        title: initialData.title,
        place_id: initialData.place_id,
        cover_image_url: initialData.cover_image_url,
        hasCoverImage: !!initialData.cover_image_url,
      });
      setFormData((prev) => ({
        ...prev,
        title: initialData.title || '',
        description: initialData.description || '',
        event_type: initialData.event_type || 'concert',
        start_datetime: initialData.start_datetime || new Date().toISOString(),
        end_datetime: initialData.end_datetime,
        doors_open_time: initialData.doors_open_time,
        place_id: initialData.place_id || '',
        is_published: initialData.is_published ?? false,
        is_listed: initialData.is_listed ?? true,
        cover_image_url: initialData.cover_image_url || '',
        promo_video_url: initialData.promo_video_url || '',
        genre: initialData.genre || [],
        lineup: initialData.lineup || [],
        ticket_url: initialData.ticket_url || '',
        ticket_price_min: initialData.ticket_price_min,
        ticket_price_max: initialData.ticket_price_max,
        tickets_available: initialData.tickets_available ?? true,
        capacity: initialData.capacity,
        lista_nominativa_enabled: initialData.lista_nominativa_enabled ?? false,
        max_guests_per_reservation: initialData.max_guests_per_reservation || 5,
        prive_enabled: initialData.prive_enabled ?? false,
        prive_min_price: initialData.prive_min_price ?? null,
        prive_max_seats: initialData.prive_max_seats ?? 10,
        prive_deposit_required: initialData.prive_deposit_required ?? null,
        prive_total_capacity: initialData.prive_total_capacity ?? 50,
      }));
      console.log('[EventForm] FormData updated, cover_image_url:', initialData.cover_image_url || 'empty');
    }
  }, [
    initialData?.title,
    initialData?.place_id,
    initialData?.start_datetime,
    initialData?.cover_image_url,
    initialData?.id, // Add id to detect when a different event is loaded
  ]);

  // Load places
  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    try {
      const { data, error } = await managerService.getMyPlaces();
      if (error) {
        Alert.alert('Errore', 'Impossibile caricare i luoghi');
        return;
      }
      if (data) {
        setPlaces(data.places);
      }
    } catch (error) {
      console.error('Load places error:', error);
    } finally {
      setLoadingPlaces(false);
    }
  };

  const updateField = <K extends keyof EventFormData>(
    field: K,
    value: EventFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addGenre = () => {
    if (newGenreInput.trim()) {
      const genres = formData.genre || [];
      if (!genres.includes(newGenreInput.trim())) {
        updateField('genre', [...genres, newGenreInput.trim()]);
      }
      setNewGenreInput('');
    }
  };

  const removeGenre = (genre: string) => {
    const genres = formData.genre || [];
    updateField('genre', genres.filter((g) => g !== genre));
  };

  const addLineupArtist = () => {
    if (newLineupInput.trim()) {
      const lineup = formData.lineup || [];
      updateField('lineup', [...lineup, newLineupInput.trim()]);
      setNewLineupInput('');
    }
  };

  const removeLineupArtist = (index: number) => {
    const lineup = formData.lineup || [];
    updateField('lineup', lineup.filter((_, i) => i !== index));
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          'Permesso Negato',
          'È necessario concedere l\'accesso alla galleria per caricare un\'immagine.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Get auth token
        const session = await storage.getSession();
        if (!session?.accessToken) {
          Alert.alert('Errore', 'Sessione scaduta. Effettua nuovamente il login.');
          return;
        }

        setUploadingImage(true);

        try {
          // Upload image to server
          const uploadResult = await uploadService.uploadEventImage(
            {
              uri: asset.uri,
              name: asset.fileName || `event-${Date.now()}.jpg`,
              type: asset.mimeType || 'image/jpeg',
            },
            session.accessToken
          );

          // Store the server URL, not the local URI
          updateField('cover_image_url', uploadResult.url);
          console.log('[EventForm] Image uploaded successfully:', uploadResult.url);
        } catch (uploadError) {
          console.error('[EventForm] Image upload error:', uploadError);
          Alert.alert('Errore', 'Impossibile caricare l\'immagine sul server');
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Errore', 'Impossibile selezionare l\'immagine');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.title?.trim()) {
      Alert.alert('Errore', 'Inserisci il titolo dell\'evento');
      return;
    }
    if (!formData.place_id) {
      Alert.alert('Errore', 'Seleziona un luogo');
      return;
    }
    if (!formData.start_datetime) {
      Alert.alert('Errore', 'Seleziona data e ora di inizio');
      return;
    }

    onSubmit(formData as EventFormData);
  };

  const selectedPlace = places.find((p) => p.id === formData.place_id);

  const filteredPlaces = places.filter((place) =>
    place.name.toLowerCase().includes(placeSearch.toLowerCase()) ||
    place.city.toLowerCase().includes(placeSearch.toLowerCase())
  );

  // Debug: Log formData.cover_image_url when it changes
  useEffect(() => {
    console.log('[EventForm] formData.cover_image_url changed:', formData.cover_image_url);
    // Reset image error state when URL changes
    if (formData.cover_image_url) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [formData.cover_image_url]);

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false}>
      <View className="p-4 gap-6">

        {/* BASIC INFO SECTION */}
        <View className="gap-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Type size={20} color={iconColor} />
            <Text className="text-lg font-bold text-foreground">Informazioni Base</Text>
          </View>

          {/* Title */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              Titolo dell'Evento *
            </Text>
            <TextInput
              value={formData.title}
              onChangeText={(value) => updateField('title', value)}
              placeholder="es. Concerto Jazz sotto le stelle"
              placeholderTextColor={mutedColor}
              className="bg-muted text-foreground px-4 py-3.5 rounded-xl text-base"
            />
          </View>

          {/* Description */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              Descrizione
            </Text>
            <TextInput
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              placeholder="Descrivi cosa rende speciale questo evento..."
              placeholderTextColor={mutedColor}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-muted text-foreground px-4 py-3.5 rounded-xl text-base"
            />
          </View>
        </View>

        {/* COVER IMAGE SECTION */}
        <View className="gap-4">
          <View className="flex-row items-center gap-2 mb-2">
            <ImagePlus size={20} color={iconColor} />
            <Text className="text-lg font-bold text-foreground">Immagine di Copertina</Text>
          </View>

          {formData.cover_image_url && formData.cover_image_url.trim() !== '' && !imageError ? (
            <View style={{ position: 'relative' }}>
              {console.log('[EventForm] Rendering image with URL:', formData.cover_image_url)}
              {imageLoading && (
                <View style={{ 
                  position: 'absolute', 
                  width: '100%', 
                  height: 192, 
                  borderRadius: 12,
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  backgroundColor: '#1a1a1a',
                  zIndex: 1,
                }}>
                  <ActivityIndicator size="small" color="#888" />
                </View>
              )}
              <Image
                key={formData.cover_image_url}
                source={{ uri: formData.cover_image_url }}
                style={{ 
                  width: '100%', 
                  height: 192, 
                  borderRadius: 12,
                  backgroundColor: '#1a1a1a',
                }}
                resizeMode="cover"
                onError={(error) => {
                  console.error('[EventForm] Image load error:', error.nativeEvent.error);
                  console.error('[EventForm] Failed URL:', formData.cover_image_url);
                  setImageError(true);
                  setImageLoading(false);
                }}
                onLoad={() => {
                  console.log('[EventForm] Image loaded successfully:', formData.cover_image_url);
                  setImageLoading(false);
                }}
                onLoadStart={() => {
                  console.log('[EventForm] Image load started:', formData.cover_image_url);
                  setImageLoading(true);
                  setImageError(false);
                }}
              />
              <TouchableOpacity
                onPress={() => {
                  updateField('cover_image_url', '');
                  setImageError(false);
                  setImageLoading(false);
                }}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: '#ef4444',
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                  zIndex: 2,
                }}
              >
                <Trash2 size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickImage}
              disabled={uploadingImage}
              className="bg-muted border-2 border-dashed border-border rounded-xl p-8 items-center justify-center"
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={mutedColor} />
              ) : (
                <>
                  <ImagePlus size={48} color={mutedColor} />
                  <Text className="text-muted-foreground text-base mt-2">
                    Tocca per caricare un'immagine
                  </Text>
                  <Text className="text-muted-foreground text-xs mt-1">
                    Formato 16:9 consigliato
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Promo Video URL */}
          <View className="mt-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Video size={18} color={mutedColor} />
              <Text className="text-sm font-semibold text-foreground">
                Video Promozionale (opzionale)
              </Text>
            </View>
            <TextInput
              value={formData.promo_video_url}
              onChangeText={(value) => updateField('promo_video_url', value)}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor={mutedColor}
              keyboardType="url"
              autoCapitalize="none"
              className="bg-muted text-foreground px-4 py-3.5 rounded-xl text-base"
            />
            <Text className="text-xs text-muted-foreground mt-1">
              Link YouTube, Vimeo o altro video promozionale
            </Text>
          </View>
        </View>

        {/* EVENT TYPE SECTION */}
        <View className="gap-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Tag size={20} color={iconColor} />
            <Text className="text-lg font-bold text-foreground">Tipo di Evento *</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {eventTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => updateField('event_type', type.value)}
                className={`px-4 py-3 rounded-xl flex-row items-center gap-2 ${
                  formData.event_type === type.value
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              >
                <Text className="text-base">{type.icon}</Text>
                <Text
                  className={`text-sm font-medium ${
                    formData.event_type === type.value
                      ? 'text-primary-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* LOCATION SECTION */}
        <View className="gap-4">
          <View className="flex-row items-center gap-2 mb-2">
            <MapPin size={20} color={iconColor} />
            <Text className="text-lg font-bold text-foreground">Luogo *</Text>
          </View>

          {loadingPlaces ? (
            <View className="bg-muted p-4 rounded-xl">
              <ActivityIndicator size="small" color={mutedColor} />
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowPlaceModal(true)}
              className={`p-4 rounded-xl border-2 ${
                selectedPlace
                  ? 'bg-primary/10 border-primary'
                  : 'bg-muted border-muted'
              }`}
            >
              {selectedPlace ? (
                <View>
                  <Text className="text-foreground font-semibold text-base">
                    {selectedPlace.name}
                  </Text>
                  <Text className="text-muted-foreground text-sm mt-1">
                    {selectedPlace.city}
                  </Text>
                </View>
              ) : (
                <Text className="text-muted-foreground text-base">
                  Tocca per selezionare un luogo
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* GENRE SECTION */}
        <View className="gap-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Music size={20} color={iconColor} />
            <Text className="text-lg font-bold text-foreground">Generi Musicali</Text>
          </View>

          {/* Genre Tags */}
          <View className="flex-row flex-wrap gap-2">
            {(formData.genre || []).map((genre, index) => (
              <View
                key={index}
                className="bg-primary/20 px-3 py-2 rounded-full flex-row items-center gap-2"
              >
                <Text className="text-primary font-medium">{genre}</Text>
                <TouchableOpacity onPress={() => removeGenre(genre)}>
                  <X size={16} color={iconColor} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Add Genre Input */}
          <View className="flex-row gap-2">
            <TextInput
              value={newGenreInput}
              onChangeText={setNewGenreInput}
              placeholder="es. House, Techno, Pop..."
              placeholderTextColor={mutedColor}
              onSubmitEditing={addGenre}
              returnKeyType="done"
              className="flex-1 bg-muted text-foreground px-4 py-3.5 rounded-xl text-base"
            />
            <TouchableOpacity
              onPress={addGenre}
              disabled={!newGenreInput.trim()}
              className={`px-4 py-3.5 rounded-xl ${
                newGenreInput.trim() ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <Plus
                size={20}
                color={newGenreInput.trim() ? '#fff' : mutedColor}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* LINEUP SECTION */}
        <View className="gap-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Music size={20} color={iconColor} />
            <Text className="text-lg font-bold text-foreground">Lineup Artisti</Text>
          </View>

          {/* Lineup List */}
          {(formData.lineup || []).length > 0 && (
            <View className="gap-2">
              {(formData.lineup || []).map((artist, index) => (
                <View
                  key={index}
                  className="bg-muted px-4 py-3 rounded-xl flex-row items-center justify-between"
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-8 h-8 bg-primary rounded-full items-center justify-center">
                      <Text className="text-primary-foreground font-bold">
                        {index + 1}
                      </Text>
                    </View>
                    <Text className="text-foreground font-medium flex-1">
                      {artist}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeLineupArtist(index)}
                    className="w-8 h-8 items-center justify-center"
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Add Artist Input */}
          <View className="flex-row gap-2">
            <TextInput
              value={newLineupInput}
              onChangeText={setNewLineupInput}
              placeholder="Nome artista o DJ..."
              placeholderTextColor={mutedColor}
              onSubmitEditing={addLineupArtist}
              returnKeyType="done"
              className="flex-1 bg-muted text-foreground px-4 py-3.5 rounded-xl text-base"
            />
            <TouchableOpacity
              onPress={addLineupArtist}
              disabled={!newLineupInput.trim()}
              className={`px-4 py-3.5 rounded-xl ${
                newLineupInput.trim() ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <Plus
                size={20}
                color={newLineupInput.trim() ? '#fff' : mutedColor}
              />
            </TouchableOpacity>
          </View>

          {(formData.lineup || []).length === 0 && (
            <Text className="text-xs text-muted-foreground text-center py-2">
              Aggiungi artisti per mostrare la lineup dell'evento
            </Text>
          )}
        </View>

        {/* DATE & TIME SECTION */}
        <View className="gap-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Calendar size={20} color={iconColor} />
            <Text className="text-lg font-bold text-foreground">Data e Orario</Text>
          </View>

          {/* Start Date/Time */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              Inizio *
            </Text>
            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              className="bg-muted px-4 py-3.5 rounded-xl"
            >
              <Text className="text-foreground text-base">
                {new Date(formData.start_datetime || new Date()).toLocaleString('it-IT', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={new Date(formData.start_datetime || new Date())}
                mode="datetime"
                display="default"
                onChange={(event, date) => {
                  setShowStartPicker(false);
                  if (date) {
                    updateField('start_datetime', date.toISOString());
                  }
                }}
              />
            )}
          </View>

          {/* End Date/Time */}
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-foreground">
                Fine (opzionale)
              </Text>
              {formData.end_datetime && (
                <TouchableOpacity
                  onPress={() => updateField('end_datetime', undefined)}
                  className="px-2 py-1"
                >
                  <Text className="text-red-500 text-xs">Rimuovi</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              className="bg-muted px-4 py-3.5 rounded-xl"
            >
              <Text className="text-foreground text-base">
                {formData.end_datetime
                  ? new Date(formData.end_datetime).toLocaleString('it-IT', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Tocca per impostare'}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={new Date(formData.end_datetime || formData.start_datetime || new Date())}
                mode="datetime"
                display="default"
                minimumDate={new Date(formData.start_datetime || new Date())}
                onChange={(event, date) => {
                  setShowEndPicker(false);
                  if (date) {
                    updateField('end_datetime', date.toISOString());
                  }
                }}
              />
            )}
          </View>

          {/* Doors Open Time */}
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Clock size={16} color={mutedColor} />
                <Text className="text-sm font-semibold text-foreground">
                  Apertura Porte (opzionale)
                </Text>
              </View>
              {formData.doors_open_time && (
                <TouchableOpacity
                  onPress={() => updateField('doors_open_time', undefined)}
                  className="px-2 py-1"
                >
                  <Text className="text-red-500 text-xs">Rimuovi</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setShowDoorsOpenTimePicker(true)}
              className="bg-muted px-4 py-3.5 rounded-xl"
            >
              <Text className="text-foreground text-base">
                {formData.doors_open_time
                  ? formData.doors_open_time
                  : 'Tocca per impostare orario'}
              </Text>
            </TouchableOpacity>
            {showDoorsOpenTimePicker && (
              <DateTimePicker
                value={(() => {
                  if (formData.doors_open_time) {
                    const [hours, minutes] = formData.doors_open_time.split(':');
                    const date = new Date();
                    date.setHours(parseInt(hours), parseInt(minutes), 0);
                    return date;
                  }
                  return new Date();
                })()}
                mode="time"
                display="default"
                onChange={(event, date) => {
                  setShowDoorsOpenTimePicker(false);
                  if (date) {
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    updateField('doors_open_time', `${hours}:${minutes}`);
                  }
                }}
              />
            )}
            <Text className="text-xs text-muted-foreground mt-1">
              Orario in cui aprono le porte prima dell'inizio evento
            </Text>
          </View>
        </View>

        {/* TICKETS SECTION */}
        <View className="gap-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Ticket size={20} color={iconColor} />
            <Text className="text-lg font-bold text-foreground">Biglietti</Text>
          </View>

          {/* Ticket URL */}
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              Link Prenotazione/Biglietti
            </Text>
            <TextInput
              value={formData.ticket_url}
              onChangeText={(value) => updateField('ticket_url', value)}
              placeholder="https://esempio.com/biglietti"
              placeholderTextColor={mutedColor}
              keyboardType="url"
              autoCapitalize="none"
              className="bg-muted text-foreground px-4 py-3.5 rounded-xl text-base"
            />
          </View>

          {/* Ticket Prices */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Prezzo Min (€)
              </Text>
              <View className="flex-row items-center bg-muted rounded-xl px-4 py-3.5">
           
                <TextInput
                  value={formData.ticket_price_min?.toString() || ''}
                  onChangeText={(value) => updateField('ticket_price_min', parseFloat(value) || undefined)}
                  placeholder="0"
                  placeholderTextColor={mutedColor}
                  keyboardType="numeric"
                  className="flex-1 text-foreground text-base ml-2"
                  style={{
                    padding: 0,
                    paddingVertical: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                    margin: 0,
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                  }}
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Prezzo Max (€)
              </Text>
              <View className="flex-row items-center bg-muted rounded-xl px-4 py-3.5">
        
                <TextInput
                  value={formData.ticket_price_max?.toString() || ''}
                  onChangeText={(value) => updateField('ticket_price_max', parseFloat(value) || undefined)}
                  placeholder="0"
                  placeholderTextColor={mutedColor}
                  keyboardType="numeric"
                  className="flex-1 text-foreground text-base ml-2"
                  style={{
                    padding: 0,
                    paddingVertical: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                    margin: 0,
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                  }}
                />
              </View>
            </View>
          </View>

          {/* Tickets Available Toggle */}
          <View className="flex-row items-center justify-between bg-muted/50 p-4 rounded-xl border border-border">
            <View className="flex-row items-center gap-3 flex-1">
              <TicketCheck size={20} color={formData.tickets_available ? '#10b981' : mutedColor} />
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-base">
                  Biglietti Disponibili
                </Text>
                <Text className="text-sm text-muted-foreground mt-0.5">
                  {formData.tickets_available
                    ? 'I biglietti sono ancora in vendita'
                    : 'Biglietti esauriti o non in vendita'}
                </Text>
              </View>
            </View>
            <Switch
              value={formData.tickets_available}
              onValueChange={(value) => updateField('tickets_available', value)}
              trackColor={{ false: '#444', true: '#10b981' }}
              thumbColor={formData.tickets_available ? '#fff' : '#ccc'}
            />
          </View>
        </View>

        {/* GUEST LIST SECTION */}
        <View className="gap-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Users size={20} color={iconColor} />
            <Text className="text-lg font-bold text-foreground">Lista Nominativa</Text>
          </View>

          {/* Enable Guest List Toggle */}
          <View className="flex-row items-center justify-between bg-muted/50 p-4 rounded-xl border border-border">
            <View className="flex-1 mr-3">
              <Text className="text-foreground font-semibold text-base">
                Abilita Iscrizioni Lista
              </Text>
              <Text className="text-sm text-muted-foreground mt-0.5">
                Permetti agli utenti di prenotarsi per l'evento
              </Text>
            </View>
            <Switch
              value={formData.lista_nominativa_enabled}
              onValueChange={(value) => updateField('lista_nominativa_enabled', value)}
              trackColor={{ false: '#444', true: '#10b981' }}
              thumbColor={formData.lista_nominativa_enabled ? '#fff' : '#ccc'}
            />
          </View>

          {/* Capacity & Max Guests */}
          {formData.lista_nominativa_enabled && (
            <>
              {/* Total Capacity - Pista */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Posti Disponibili Pista
                </Text>
                <View className="flex-row items-center bg-muted rounded-xl px-4 py-3.5">
                  <Users size={18} color={mutedColor} />
                  <TextInput
                    value={formData.capacity?.toString() || ''}
                    onChangeText={(value) => updateField('capacity', parseInt(value) || undefined)}
                    placeholder="es. 100"
                    placeholderTextColor={mutedColor}
                    keyboardType="numeric"
                    className="flex-1 text-foreground text-base ml-2"
                    style={{
                      padding: 0,
                      paddingVertical: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                      margin: 0,
                      includeFontPadding: false,
                      textAlignVertical: 'center',
                    }}
                  />
                </View>
                <Text className="text-xs text-muted-foreground mt-2">
                  Numero massimo di posti disponibili per la pista (lista nominativa)
                </Text>
              </View>

              {/* Max Guests Per Reservation */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Ospiti Max per Prenotazione
                </Text>
                <View className="flex-row items-center bg-muted rounded-xl px-4 py-3.5">
                  <Users size={18} color={mutedColor} />
                  <TextInput
                    value={formData.max_guests_per_reservation?.toString() || '5'}
                    onChangeText={(value) => updateField('max_guests_per_reservation', parseInt(value) || 5)}
                    placeholder="5"
                    placeholderTextColor={mutedColor}
                    keyboardType="numeric"
                    className="flex-1 text-foreground text-base ml-2"
                    style={{
                      padding: 0,
                      paddingVertical: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                      margin: 0,
                      includeFontPadding: false,
                      textAlignVertical: 'center',
                    }}
                  />
                </View>
                <Text className="text-xs text-muted-foreground mt-2">
                  Numero massimo di ospiti che un utente può portare con sé
                </Text>
              </View>
            </>
          )}
        </View>

        {/* PRIVE SECTION */}
        <View className="gap-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Users size={20} color={iconColor} />
            <Text className="text-lg font-bold text-foreground">Configurazione Pista/Privé</Text>
          </View>

          {/* Enable Prive Toggle */}
          <View className="flex-row items-center justify-between bg-muted/50 p-4 rounded-xl border border-border">
            <View className="flex-1 mr-3">
              <Text className="text-foreground font-semibold text-base">
                Abilita distinzione Pista/Privé
              </Text>
              <Text className="text-sm text-muted-foreground mt-0.5">
                Permetti prenotazioni tavoli VIP oltre alla lista pista
              </Text>
            </View>
            <Switch
              value={formData.prive_enabled}
              onValueChange={(value) => updateField('prive_enabled', value)}
              trackColor={{ false: '#444', true: '#10b981' }}
              thumbColor={formData.prive_enabled ? '#fff' : '#ccc'}
            />
          </View>

          {/* Prive Configuration */}
          {formData.prive_enabled && (
            <>
              {/* Total Prive Capacity */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Posti Totali Privé
                </Text>
                <View className="flex-row items-center bg-muted rounded-xl px-4 py-3.5">
                  <Users size={18} color={mutedColor} />
                  <TextInput
                    value={formData.prive_total_capacity?.toString() || '50'}
                    onChangeText={(value) => updateField('prive_total_capacity', parseInt(value) || 50)}
                    placeholder="50"
                    placeholderTextColor={mutedColor}
                    keyboardType="numeric"
                    className="flex-1 text-foreground text-base ml-2"
                    style={{
                      padding: 0,
                      paddingVertical: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                      margin: 0,
                      includeFontPadding: false,
                      textAlignVertical: 'center',
                    }}
                  />
                </View>
                <Text className="text-xs text-muted-foreground mt-2">
                  Numero totale di posti disponibili per i tavoli privé
                </Text>
              </View>

              {/* Max Seats Per Table */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Posti Massimi per Tavolo
                </Text>
                <View className="flex-row items-center bg-muted rounded-xl px-4 py-3.5">
                  <Users size={18} color={mutedColor} />
                  <TextInput
                    value={formData.prive_max_seats?.toString() || '10'}
                    onChangeText={(value) => updateField('prive_max_seats', parseInt(value) || 10)}
                    placeholder="10"
                    placeholderTextColor={mutedColor}
                    keyboardType="numeric"
                    className="flex-1 text-foreground text-base ml-2"
                    style={{
                      padding: 0,
                      paddingVertical: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                      margin: 0,
                      includeFontPadding: false,
                      textAlignVertical: 'center',
                    }}
                  />
                </View>
                <Text className="text-xs text-muted-foreground mt-2">
                  Numero massimo di persone per tavolo privé
                </Text>
              </View>

              {/* Min Price */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Prezzo Minimo Tavolo (€)
                </Text>
                <View className="flex-row items-center bg-muted rounded-xl px-4 py-3.5">
                  <Euro size={18} color={mutedColor} />
                  <TextInput
                    value={formData.prive_min_price?.toString() || ''}
                    onChangeText={(value) => updateField('prive_min_price', value ? parseFloat(value) : null)}
                    placeholder="100.00"
                    placeholderTextColor={mutedColor}
                    keyboardType="decimal-pad"
                    className="flex-1 text-foreground text-base ml-2"
                    style={{
                      padding: 0,
                      paddingVertical: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                      margin: 0,
                      includeFontPadding: false,
                      textAlignVertical: 'center',
                    }}
                  />
                </View>
                <Text className="text-xs text-muted-foreground mt-2">
                  Prezzo minimo richiesto per prenotare un tavolo privé
                </Text>
              </View>

              {/* Deposit Required */}
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Deposito Richiesto (€)
                </Text>
                <View className="flex-row items-center bg-muted rounded-xl px-4 py-3.5">
                  <Euro size={18} color={mutedColor} />
                  <TextInput
                    value={formData.prive_deposit_required?.toString() || ''}
                    onChangeText={(value) => updateField('prive_deposit_required', value ? parseFloat(value) : null)}
                    placeholder="50.00"
                    placeholderTextColor={mutedColor}
                    keyboardType="decimal-pad"
                    className="flex-1 text-foreground text-base ml-2"
                    style={{
                      padding: 0,
                      paddingVertical: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                      margin: 0,
                      includeFontPadding: false,
                      textAlignVertical: 'center',
                    }}
                  />
                </View>
                <Text className="text-xs text-muted-foreground mt-2">
                  Deposito richiesto al momento della prenotazione (opzionale)
                </Text>
              </View>
            </>
          )}
        </View>

        {/* PUBLISH SECTION */}
        <View className="gap-4">
          <View className="flex-row items-center justify-between bg-muted/50 p-4 rounded-xl border border-border">
            <View className="flex-row items-center gap-3 flex-1">
              {formData.is_published ? (
                <Eye size={24} color={iconColor} />
              ) : (
                <EyeOff size={24} color={mutedColor} />
              )}
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-base">
                  {formData.is_published ? 'Evento Pubblico' : 'Bozza Privata'}
                </Text>
                <Text className="text-sm text-muted-foreground mt-0.5">
                  {formData.is_published
                    ? 'Visibile a tutti gli utenti'
                    : 'Solo tu puoi vederlo'}
                </Text>
              </View>
            </View>
            <Switch
              value={formData.is_published}
              onValueChange={(value) => updateField('is_published', value)}
              trackColor={{ false: '#444', true: '#10b981' }}
              thumbColor={formData.is_published ? '#fff' : '#ccc'}
            />
          </View>

          {/* Is Listed Toggle */}
          <View className="flex-row items-center justify-between bg-muted/50 p-4 rounded-xl border border-border">
            <View className="flex-row items-center gap-3 flex-1">
              <List size={24} color={formData.is_listed ? iconColor : mutedColor} />
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-base">
                  {formData.is_listed ? 'Visibile nelle Liste' : 'Nascosto dalle Liste'}
                </Text>
                <Text className="text-sm text-muted-foreground mt-0.5">
                  {formData.is_listed
                    ? 'Appare nelle ricerche e liste eventi'
                    : 'Accessibile solo con link diretto'}
                </Text>
              </View>
            </View>
            <Switch
              value={formData.is_listed}
              onValueChange={(value) => updateField('is_listed', value)}
              trackColor={{ false: '#444', true: '#10b981' }}
              thumbColor={formData.is_listed ? '#fff' : '#ccc'}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          className="bg-primary py-4 rounded-xl items-center active:opacity-70 shadow-lg"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-primary-foreground font-bold text-lg">
              {initialData ? '💾 Salva Modifiche' : '✨ Crea Evento'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View className="h-8" />
      </View>

      {/* Place Selection Modal */}
      <Modal
        visible={showPlaceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPlaceModal(false)}
      >
        <View className="flex-1 bg-background">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">Seleziona Luogo</Text>
            <TouchableOpacity
              onPress={() => setShowPlaceModal(false)}
              className="w-10 h-10 items-center justify-center rounded-full bg-muted"
            >
              <X size={20} color={iconColor} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="p-4 border-b border-border">
            <View className="flex-row items-center bg-muted px-4 py-3 rounded-xl">
              <Search size={20} color={mutedColor} />
              <TextInput
                value={placeSearch}
                onChangeText={setPlaceSearch}
                placeholder="Cerca per nome o città..."
                placeholderTextColor={mutedColor}
                className="flex-1 text-foreground ml-2 text-base"
              />
              {placeSearch.length > 0 && (
                <TouchableOpacity onPress={() => setPlaceSearch('')}>
                  <X size={18} color={mutedColor} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Places List */}
          <ScrollView className="flex-1">
            <View className="p-4 gap-2">
              {filteredPlaces.length === 0 ? (
                <View className="items-center justify-center py-12">
                  <MapPin size={48} color={mutedColor} />
                  <Text className="text-muted-foreground text-base mt-4">
                    Nessun luogo trovato
                  </Text>
                </View>
              ) : (
                filteredPlaces.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    onPress={() => {
                      updateField('place_id', place.id);
                      setShowPlaceModal(false);
                      setPlaceSearch('');
                    }}
                    className={`p-4 rounded-xl border-2 ${
                      formData.place_id === place.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-muted border-transparent'
                    }`}
                  >
                    <View className="flex-row items-center">
                      <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                        formData.place_id === place.id ? 'bg-primary' : 'bg-background'
                      }`}>
                        <MapPin
                          size={20}
                          color={formData.place_id === place.id ? '#fff' : mutedColor}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className={`font-semibold text-base ${
                          formData.place_id === place.id ? 'text-primary' : 'text-foreground'
                        }`}>
                          {place.name}
                        </Text>
                        <Text className="text-sm text-muted-foreground mt-0.5">
                          📍 {place.city}
                        </Text>
                      </View>
                      {formData.place_id === place.id && (
                        <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                          <Text className="text-white font-bold">✓</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}
