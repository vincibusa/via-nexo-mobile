# 🎨 Wireframe: Bottom Navigation Bar - Liquid Glass Style

## Layout Proposto

```
┌─────────────────────────────────────────────────────────┐
│  STATUS BAR (iOS)                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Oggi                                    [VB]   │   │  ← Header
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │           CONTENT AREA (Map/Stories)            │   │
│  │                                                 │   │
│  │    [Scrollable content with cards/images]       │   │
│  │                                                 │   │
│  │                                                 │   │
│  │                                                 │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ╔═══════════════════════════════════════════════════╗ │
│  ║  ┌─────────┐                                       ║ │
│  ║  │  🔍     │  ← SEARCH MOSSO A SINISTRA           ║ │
│  ║  │ Search  │     (Icona outline quando inattiva)  ║ │
│  ║  └─────────┘                                       ║ │
│  ║                                                   ║ │
│  ║       ┌─────────────────────────────────────┐     ║ │
│  ║       │    🏠      🔍      ▶️      💬      👤    │     ║ │
│  ║       │   Home    Cerca  Discovery Messaggi Profilo│     ║ │
│  ║       │    ↑                                    │     ║ │
│  ║       │  ACTIVE (icona piena + colore primario) │     ║ │
│  ║       └─────────────────────────────────────┘     ║ │
│  ║                    ↑                              ║ │
│  ║         FLOATING TAB BAR (Liquid Glass)          ║ │
│  ╚═══════════════════════════════════════════════════╝ │
│                    ↑                                   │
│    SFONDO: Blur/Frosted Glass con bordo sottile       │
│    - iOS 26+: expo-glass-effect (Liquid Glass nativo) │
│    - iOS <26: expo-blur (fallback elegante)           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🎨 Specifiche Design

### Bottom Bar - Liquid Glass
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ┌─────────────────────────────────────────────────┐  │
│   │                                                 │  │
│   │  🔍    │    🏠    ▶️    💬    👤               │  │
│   │ Search │   Home  Disc  Mess  Prof               │  │
│   │        │    ★                                   │  │
│   │        │   Active                               │  │
│   └─────────────────────────────────────────────────┘  │
│                                                         │
│   Caratteristiche:                                      │
│   • Sfondo: blur(20px) + rgba(255,255,255,0.15)        │
│   • Bordo: 1px rgba(255,255,255,0.2)                   │
│   • Border-radius: 32px (pill shape)                   │
│   • Shadow: 0 8px 32px rgba(0,0,0,0.12)                │
│   • Padding: 12px vertical, 24px horizontal            │
│   • Margin: 16px dal fondo, 24px ai lati               │
│                                                         │
│   Tab Active State:                                     │
│   • Icona: piena (filled) invece di outline            │
│   • Colore: theme.primary (blu)                        │
│   • Label: font-weight 600                             │
│                                                         │
│   Tab Inactive State:                                   │
│   • Icona: outline/stroke                              │
│   • Colore: rgba(255,255,255,0.6)                      │
│   • Label: font-weight 400                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🧩 Componenti da Modificare/Creare

### 1. Tab Layout (`app/(app)/(tabs)/_layout.tsx`)
- [ ] Ordine tab: Search, Home, Discovery, Messages, Profile
- [ ] Stile custom tabBar con Liquid Glass
- [ ] Icone filled/outline in base allo stato
- [ ] Spostare search come primo tab

### 2. Home Screen (`app/(app)/(tabs)/index.tsx`)
- [ ] Ottimizzare layout per floating tab bar
- [ ] Aggiungere padding bottom per evitare overlap
- [ ] Verificare scroll performance

### 3. Nuovo Componente: `LiquidGlassTabBar`
```typescript
// components/navigation/liquid-glass-tab-bar.tsx
interface LiquidGlassTabBarProps {
  state: NavigationState;
  descriptors: SceneDescriptorMap;
  navigation: NavigationHelpers;
}

// Features:
// - expo-blur come base (fallback universale)
// - expo-glass-effect per iOS 26+ (enhancement)
// - Animazioni smooth su cambio tab
// - Haptic feedback su press
```

## 📦 Dipendenze da Installare

```bash
# Base blur effect (funziona su iOS/Android/Web)
npx expo install expo-blur

# Liquid Glass nativo iOS 26+ (opzionale, enhancement)
npx expo install expo-glass-effect

# Icone filled/outline
# già presente: lucide-react-native
```

## 🎭 Varianti Icone (Lucide)

| Tab | Inactive (Outline) | Active (Filled) |
|-----|-------------------|-----------------|
| Search | `Search` | `Search` (fill) |
| Home | `Home` | `Home` (fill) |
| Discovery | `Play` | `Play` (fill) |
| Messages | `MessageCircle` | `MessageCircle` (fill) |
| Profile | `User` | `User` (fill) |

## 🔧 Implementazione Tecnica

### Strategy Pattern per Glass Effect
```typescript
// Fallback intelligente
const GlassContainer = Platform.select({
  ios: IOSGlassView,      // expo-glass-effect o expo-blur
  android: AndroidBlurView, // expo-blur (semi-transparent)
  default: WebBlurView,    // expo-blur
});
```

### Animation Specs
- **Tab switch**: 200ms ease-out
- **Icon scale on press**: 0.95 → 1.0 (100ms)
- **Active indicator**: slide + fade (300ms spring)

## ✅ Checklist Implementazione

1. [ ] Installare dipendenze
2. [ ] Creare componente LiquidGlassTabBar
3. [ ] Modificare _layout.tsx con nuovo ordine tab
4. [ ] Aggiornare HomeScreen con padding corretto
5. [ ] Testare su iOS (simulator/device)
6. [ ] Verificare fallback Android
7. [ ] Ottimizzare performance

---

**Nota**: La search viene spostata a SINISTRA come richiesto, con la floating tab bar stile iOS 18 App Store.
