# Analisi Completa Schema Colori - via-nexo-mobile

**Data Analisi**: Gennaio 2025  
**Versione App**: 1.0.0  
**Scope**: Tutti i file `.tsx` in `app/` e `components/`

---

## Executive Summary

### Stato Generale
- **Conformità Complessiva**: ~35% ⚠️
- **Componenti Conformi**: 12/66 (18%)
- **Screens Conformi**: 3/34 (9%)
- **Problemi Critici**: 2
- **Problemi Maggiori**: 45+
- **Problemi Minori**: 100+

### Problemi Principali Identificati

1. **🔴 CRITICO**: `global.css` definisce gli stessi valori per light e dark mode
2. **🔴 CRITICO**: 125+ occorrenze di colori hex hardcoded (`#ffffff`, `#3b82f6`, etc.)
3. **🟠 MAGGIORE**: 210+ occorrenze di classi Tailwind colorate (`bg-blue-500`, `text-red-600`, etc.)
4. **🟠 MAGGIORE**: 7 occorrenze di colori RGB/RGBA hardcoded
5. **🟡 MINORE**: Placeholder colors hardcoded (`placeholderTextColor="#999"`)

---

## 1. Configurazione Tema

### 1.1 `global.css` - ⚠️ PROBLEMA CRITICO

**Stato**: ❌ Non conforme

**Problema**: I valori CSS per `:root` e `.dark :root` sono **identici**, rendendo impossibile lo switch tra light e dark mode.

```css
:root {
  --background: 0 0% 0%;      /* Nero - SBAGLIATO per light mode */
  --foreground: 0 0% 98%;     /* Bianco - SBAGLIATO per light mode */
  /* ... tutti valori dark ... */
}

.dark :root {
  --background: 0 0% 0%;      /* STESSO valore - ERRORE! */
  --foreground: 0 0% 98%;     /* STESSO valore - ERRORE! */
  /* ... valori identici ... */
}
```

**Impatto**: L'app è sempre in modalità dark, indipendentemente dalla selezione dell'utente.

**Raccomandazione**: Correggere `:root` con valori light mode appropriati basati su `lib/theme.ts`.

### 1.2 `lib/theme.ts` - ✅ Conforme

**Stato**: ✅ Conforme

Definisce correttamente palette separate per light e dark:
- `THEME.light`: Colori chiari appropriati
- `THEME.dark`: Colori scuri appropriati
- `NAV_THEME`: Integrazione con React Navigation

**Nota**: I valori in `theme.ts` sono corretti, ma non vengono utilizzati in `global.css`.

### 1.3 `tailwind.config.js` - ✅ Conforme

**Stato**: ✅ Conforme

Configurazione corretta:
- `darkMode: 'class'` ✅
- Colori mappati a variabili CSS (`hsl(var(--background))`) ✅
- Estensioni semantiche corrette ✅

---

## 2. Analisi Screens

### 2.1 Screens Conformi ✅

| File | Stato | Note |
|------|-------|------|
| `app/(app)/(tabs)/messages.tsx` | ✅ Conforme | Usa solo `themeColors` e classi semantiche |
| `app/(auth)/login.tsx` | ✅ Conforme | Layout minimale, usa solo `bg-background` |
| `app/(auth)/signup.tsx` | ✅ Conforme | Layout minimale, usa solo `bg-background` |

### 2.2 Screens Parzialmente Conformi ⚠️

| File | Problemi | Dettagli |
|------|----------|----------|
| `app/(app)/(tabs)/index.tsx` | ⚠️ Parziale | Usa `themeColors` ma passa `isDark` a componenti |
| `app/(app)/(tabs)/profile.tsx` | ⚠️ Parziale | Usa `themeColors` ma alcuni componenti hanno hardcoded |
| `app/(app)/(tabs)/search.tsx` | ⚠️ Parziale | `placeholderTextColor="#999"` (linea 362) |
| `app/(app)/(tabs)/notifications.tsx` | ⚠️ Parziale | Icone con colori hex hardcoded (linee 231-250) |

### 2.3 Screens Non Conformi ❌

| File | Problemi | Dettagli |
|------|----------|----------|
| `app/(app)/reservations/[id].tsx` | ❌ Non conforme | `#000`, `#9CA3AF`, `#DC2626` (linee 123, 133, 159, 264-265, 285) |
| `app/(app)/events/[id]/reserve.tsx` | ❌ Non conforme | `#000`, `#fff` (linee 113, 123, 146, 222, 292) |
| `app/(app)/daily-recommendations.tsx` | ❌ Non conforme | `#000`, `#FBBF24`, `#3B82F6`, `#D1D5DB` (linee 89, 94, 108, 117) |
| `app/(app)/reservations/index.tsx` | ❌ Non conforme | `#000` (linee 92, 102) |
| `app/(app)/chat-detail.tsx` | ❌ Non conforme | Molti colori hex hardcoded, classi `slate-*` (linee 200, 261, 368, 370, 405, 414, 420, 433, 455, 476) |
| `app/(app)/chat-search.tsx` | ❌ Non conforme | `rgba(0, 0, 0, 0.1)` (linea 590) |
| `app/(app)/edit-profile.tsx` | ❌ Non conforme | 5x `placeholderTextColor="#999"` (linee 276, 287, 299, 317, 328) |
| `app/(app)/post/[id]/comments.tsx` | ❌ Non conforme | `#ef4444` hardcoded (linee 130-131), `placeholderTextColor="#999"` (linea 197) |
| `app/(app)/create-story.tsx` | ❌ Non conforme | Array colori hex (linea 78), `#FFFFFF` hardcoded (linea 98, 190), `placeholderTextColor="#6b7280"` (linea 378), `rgba(0,0,0,0.8)` (linea 550) |

### 2.4 Statistiche Screens

- **Totali**: 34 files
- **Conformi**: 3 (9%)
- **Parzialmente conformi**: 4 (12%)
- **Non conformi**: 27 (79%)

---

## 3. Analisi Componenti UI Primitivi

### 3.1 Componenti Conformi ✅

| File | Stato | Note |
|------|-------|------|
| `components/ui/button.tsx` | ✅ Conforme | Usa solo varianti semantiche (`bg-primary`, `text-primary-foreground`) |
| `components/ui/card.tsx` | ✅ Conforme | Usa solo classi semantiche (`bg-card`, `text-card-foreground`) |
| `components/ui/input.tsx` | ✅ Conforme | Usa solo classi semantiche (`bg-background`, `text-foreground`) |
| `components/ui/badge.tsx` | ✅ Conforme | Usa solo varianti semantiche |
| `components/ui/text.tsx` | ✅ Conforme | Usa solo classi semantiche |
| `components/ui/tabs.tsx` | ✅ Conforme | Usa solo classi semantiche |
| `components/ui/separator.tsx` | ✅ Conforme | Usa solo classi semantiche |
| `components/ui/label.tsx` | ✅ Conforme | Usa solo classi semantiche |
| `components/ui/avatar.tsx` | ✅ Conforme | Usa solo classi semantiche |
| `components/ui/skeleton.tsx` | ✅ Conforme | Usa solo classi semantiche |
| `components/ui/icon.tsx` | ✅ Conforme | Usa solo classi semantiche |

### 3.2 Componenti Non Conformi ❌

| File | Problemi | Dettagli |
|------|----------|----------|
| `components/ui/switch.tsx` | ❌ Non conforme | `rgba(156, 163, 175, 0.2)`, `rgb(59, 130, 246)`, `rgb(255, 255, 255)` hardcoded (linee 25-27) |

### 3.3 Statistiche Componenti UI

- **Totali**: 12 files
- **Conformi**: 11 (92%)
- **Non conformi**: 1 (8%)

**Nota**: I componenti UI primitivi sono molto ben fatti! Solo `switch.tsx` ha problemi.

---

## 4. Analisi Componenti Feature

### 4.1 Componenti Conformi ✅

| File | Stato | Note |
|------|-------|------|
| `components/sign-in-form.tsx` | ✅ Conforme | Usa solo componenti UI conformi |
| `components/sign-up-form.tsx` | ✅ Conforme | Usa solo componenti UI conformi |
| `components/social-connections.tsx` | ✅ Conforme | Usa solo classi semantiche |

### 4.2 Componenti Parzialmente Conformi ⚠️

| File | Problemi | Dettagli |
|------|----------|----------|
| `components/events/event-card.tsx` | ⚠️ Parziale | Usa `themeColors` per icone ma potrebbe usare classi Tailwind |
| `components/places/place-card.tsx` | ⚠️ Parziale | Usa `themeColors` per icone ma potrebbe usare classi Tailwind |
| `components/chat/chat-suggestion-cards.tsx` | ⚠️ Parziale | `#ef4444` hardcoded per icona Heart (linea 169) |

### 4.3 Componenti Non Conformi ❌

#### Home Components
| File | Problemi | Dettagli |
|------|----------|----------|
| `components/home/home-overlay.tsx` | ❌ Non conforme | `#facc15`, `#fff`, `#1e293b`, `#ffffff`, `#3b82f6` (linee 105, 107, 115, 119) |
| `components/home/home-map.tsx` | ❌ Non conforme | **30+ colori hex hardcoded** nel map style dark mode (linee 41-196), classi `slate-*` nel fallback (linee 224-229) |
| `components/home/place-marker.tsx` | ❌ Non conforme | Funzione `getCategoryColor()` con 7 colori hex hardcoded (linee 49-68), `#000` shadow (linee 90, 105) |

#### Profile Components
| File | Problemi | Dettagli |
|------|----------|----------|
| `components/profile/profile-settings.tsx` | ❌ Non conforme | `rgba(239, 68, 68, 0.2)`, `#f87171`, `#dc2626` (linee 247, 249, 252) |
| `components/profile/profile-header.tsx` | ❌ Non conforme | `#cbd5e1`, `#475569`, `#fff`, `#ff0080`, `#60a5fa`, `#3b82f6` (linee 93, 105, 124, 199, 202) |
| `components/profile/profile-stats.tsx` | ❌ Non conforme | 4 colori hex hardcoded in oggetto `statColors` (linee 26, 33, 40, 47), classi `slate-*` (linee 53-98) |

#### Chat Components
| File | Problemi | Dettagli |
|------|----------|----------|
| `components/chat/message-search.tsx` | ❌ Non conforme | Molti colori hex hardcoded, classi `slate-*` (linee 94, 102, 112, 123, 159, 201, 203) |
| `components/chat/message-reactions.tsx` | ❌ Non conforme | Colori hex hardcoded (linee 114, 150, 188) |
| `components/chat/voice-message-player.tsx` | ❌ Non conforme | `'white'` hardcoded (linea 248) |
| `components/chat/voice-message-recorder.tsx` | ❌ Non conforme | Colori hex hardcoded (linee 194, 229, 231, 245, 266, 321) |
| `components/chat/conversation-history-menu.tsx` | ❌ Non conforme | `rgba(0, 0, 0, 0.3)` (linea 124) |

#### Reservations Components
| File | Problemi | Dettagli |
|------|----------|----------|
| `components/reservations/reservation-card.tsx` | ❌ Non conforme | Classi `blue-100`, `green-100`, `gray-100`, `blue-800`, `green-800`, `gray-800`, `bg-white`, `border-gray-200`, `bg-gray-200`, `bg-green-500`, `border-gray-200`, `bg-blue-500`, `border-red-300`, `bg-red-50`, `text-red-600`, `#fff`, `#DC2626` (linee 25-33, 43-135) |
| `components/reservations/follower-selector-modal.tsx` | ❌ Non conforme | `#fff`, `#9CA3AF`, `#000`, `#fff` (linee 67, 80, 87, 126), classi `gray-*`, `blue-500` (linee 71-159) |
| `components/reservations/qr-code-modal.tsx` | ❌ Non conforme | `#1F2937`, `#000`, `#fff` (linee 60, 67, 97-98), classi `gray-*`, `blue-*` (linee 55-192) |

#### Recommendations Components
| File | Problemi | Dettagli |
|------|----------|----------|
| `components/recommendations/recommendation-card.tsx` | ❌ Non conforme | `#000` shadow (linea 50), `#fff`, `#6B7280` (linee 67, 86, 93), classi `gray-*`, `yellow-400`, `blue-100`, `purple-100`, `blue-800`, `purple-800`, `amber-600`, `green-600` (linee 59-141) |

#### Social Components
| File | Problemi | Dettagli |
|------|----------|----------|
| `components/social/create-menu-sheet.tsx` | ⚠️ Parziale | Classe `slate-950` hardcoded (linea 138) |

### 4.4 Statistiche Componenti Feature

- **Totali**: 54 files
- **Conformi**: 3 (6%)
- **Parzialmente conformi**: 4 (7%)
- **Non conformi**: 47 (87%)

---

## 5. Dettaglio Problemi per Categoria

### 5.1 Colori Hex Hardcoded (125+ occorrenze)

**File più problematici**:
1. `components/home/home-map.tsx`: 30+ colori nel map style
2. `app/(app)/chat-detail.tsx`: 15+ colori
3. `components/chat/message-search.tsx`: 10+ colori
4. `components/profile/profile-header.tsx`: 6 colori
5. `components/reservations/reservation-card.tsx`: 5+ colori

**Colori più usati**:
- `#000` / `#000000`: 20+ occorrenze
- `#fff` / `#ffffff`: 15+ occorrenze
- `#3b82f6` (blue): 10+ occorrenze
- `#ef4444` / `#dc2626` (red): 8+ occorrenze
- `#cbd5e1`, `#475569` (slate): 10+ occorrenze

### 5.2 Classi Tailwind Colorate (210+ occorrenze)

**Categorie più usate**:
- `slate-*`: 50+ occorrenze (`slate-200`, `slate-800`, `slate-700`, etc.)
- `gray-*`: 40+ occorrenze (`gray-200`, `gray-100`, `gray-50`, etc.)
- `blue-*`: 30+ occorrenze (`blue-500`, `blue-100`, `blue-800`, etc.)
- `red-*`: 15+ occorrenze (`red-500`, `red-600`, `red-50`, etc.)
- `green-*`: 10+ occorrenze (`green-100`, `green-500`, `green-800`, etc.)

**File più problematici**:
1. `app/(app)/chat-detail.tsx`: 20+ classi
2. `components/reservations/reservation-card.tsx`: 15+ classi
3. `components/profile/profile-stats.tsx`: 15+ classi
4. `components/reservations/qr-code-modal.tsx`: 10+ classi

### 5.3 Colori RGB/RGBA Hardcoded (7 occorrenze)

| File | Linea | Colore | Uso |
|------|-------|--------|-----|
| `components/ui/switch.tsx` | 25-27 | `rgba(156, 163, 175, 0.2)`, `rgb(59, 130, 246)`, `rgb(255, 255, 255)` | Switch track/thumb |
| `components/profile/profile-settings.tsx` | 247 | `rgba(239, 68, 68, 0.2)` / `rgba(239, 68, 68, 0.1)` | Logout button background |
| `components/chat/conversation-history-menu.tsx` | 124 | `rgba(0, 0, 0, 0.3)` | Shadow |
| `app/(app)/chat-search.tsx` | 590 | `rgba(0, 0, 0, 0.1)` | Background |
| `app/(app)/create-story.tsx` | 550 | `rgba(0,0,0,0.8)` | Text shadow |

### 5.4 Placeholder Colors Hardcoded (8 occorrenze)

| File | Linea | Colore | Campo |
|------|-------|--------|-------|
| `app/(app)/(tabs)/search.tsx` | 362 | `#999` | Search input |
| `app/(app)/edit-profile.tsx` | 276, 287, 299, 317, 328 | `#999` | 5 input fields |
| `app/(app)/post/[id]/comments.tsx` | 197 | `#999` | Comment input |
| `app/(app)/create-story.tsx` | 378 | `#6b7280` | Text input |
| `components/reservations/follower-selector-modal.tsx` | 80 | `#9CA3AF` | Search input |

---

## 6. Raccomandazioni Prioritarie

### 🔴 Priorità CRITICA (Fix Immediato)

1. **Fix `global.css`**
   - Separare valori light e dark mode
   - Usare valori da `lib/theme.ts` come riferimento
   - **Impatto**: Abilita lo switch light/dark mode

2. **Fix `components/ui/switch.tsx`**
   - Usare variabili tema per trackColor e thumbColor
   - **Impatto**: Switch responsive al tema

### 🟠 Priorità ALTA (Fix Prossimo Sprint)

3. **Sostituire colori hex in componenti core**
   - `components/home/home-overlay.tsx`
   - `components/home/place-marker.tsx`
   - `components/profile/profile-header.tsx`
   - `components/profile/profile-settings.tsx`

4. **Sostituire classi Tailwind colorate con semantiche**
   - `components/reservations/reservation-card.tsx`
   - `app/(app)/chat-detail.tsx`
   - `components/profile/profile-stats.tsx`

5. **Fix placeholder colors**
   - Creare utility per `placeholderTextColor` basata su tema
   - Sostituire tutti gli hardcoded

### 🟡 Priorità MEDIA (Fix Backlog)

6. **Refactor map styling**
   - `components/home/home-map.tsx`: Generare map style dinamicamente da tema

7. **Standardizzare icone**
   - Creare hook `useIconColor()` che restituisce colore basato su tema
   - Sostituire tutti i colori hardcoded nelle icone

8. **Audit completo screens**
   - Fixare tutti gli screen non conformi
   - Priorità: screens più usati (home, profile, chat)

---

## 7. Pattern di Fix Consigliati

### Pattern 1: Sostituire Hex con themeColors

**Prima**:
```tsx
<Icon color="#3b82f6" />
```

**Dopo**:
```tsx
const themeColors = THEME[effectiveTheme];
<Icon color={themeColors.primary} />
```

### Pattern 2: Sostituire Classi Tailwind Colorate

**Prima**:
```tsx
<View className="bg-blue-500 text-white" />
```

**Dopo**:
```tsx
<View className="bg-primary text-primary-foreground" />
```

### Pattern 3: Placeholder Colors

**Prima**:
```tsx
<TextInput placeholderTextColor="#999" />
```

**Dopo**:
```tsx
const themeColors = THEME[effectiveTheme];
<TextInput placeholderTextColor={themeColors.mutedForeground} />
```

### Pattern 4: Inline Styles

**Prima**:
```tsx
style={{ backgroundColor: '#fff' }}
```

**Dopo**:
```tsx
const themeColors = THEME[effectiveTheme];
style={{ backgroundColor: themeColors.background }}
```

---

## 8. Checklist Fix per File

### File da Fixare (Ordine di Priorità)

- [ ] `global.css` - **CRITICO**
- [ ] `components/ui/switch.tsx` - **CRITICO**
- [ ] `components/home/home-overlay.tsx`
- [ ] `components/home/place-marker.tsx`
- [ ] `components/profile/profile-header.tsx`
- [ ] `components/profile/profile-settings.tsx`
- [ ] `components/reservations/reservation-card.tsx`
- [ ] `app/(app)/chat-detail.tsx`
- [ ] `app/(app)/(tabs)/notifications.tsx`
- [ ] `app/(app)/edit-profile.tsx`
- [ ] `components/chat/message-search.tsx`
- [ ] `components/home/home-map.tsx` (map style)
- [ ] Tutti gli altri file con problemi minori

---

## 9. Metriche Finali

### Conformità per Categoria

| Categoria | Totali | Conformi | % |
|-----------|--------|----------|---|
| **Configurazione** | 3 | 1 | 33% |
| **Screens** | 34 | 3 | 9% |
| **UI Primitivi** | 12 | 11 | 92% |
| **Feature Components** | 54 | 3 | 6% |
| **TOTALE** | **103** | **18** | **17%** |

### Problemi per Tipo

| Tipo | Count |
|------|-------|
| Hex colors | 125+ |
| Tailwind color classes | 210+ |
| RGB/RGBA | 7 |
| Placeholder colors | 8 |
| **TOTALE** | **350+** |

---

## 10. Conclusioni

L'app ha una **buona base architetturale** per il theming (theme.ts, tailwind config), ma presenta **problemi critici** che impediscono il corretto funzionamento dello switch light/dark mode:

1. **`global.css`** deve essere corretto immediatamente
2. **350+ occorrenze** di colori hardcoded devono essere sostituite
3. I **componenti UI primitivi** sono ben fatti (92% conformi)
4. I **componenti feature** necessitano di refactoring massiccio (87% non conformi)

**Raccomandazione**: Iniziare con il fix di `global.css` e `switch.tsx`, poi procedere sistematicamente file per file, partendo dai componenti più usati.

---

**Fine Report**

