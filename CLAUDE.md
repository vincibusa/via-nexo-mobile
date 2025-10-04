# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start Expo development server with cache clearing
- `npm run android` - Launch on Android emulator  
- `npm run ios` - Launch on iOS simulator (Mac only)
- `npm run web` - Launch in web browser
- `npm run clean` - Remove .expo and node_modules directories

## Project Architecture

This is a React Native mobile app built with Expo Router, TypeScript, and NativeWind (Tailwind CSS). The app follows a tab-based navigation structure with authentication flow.

### Directory Structure

- `app/` - Expo Router file-based routing
  - `_layout.tsx` - Root layout with theme and auth providers
  - `(auth)/` - Authentication screens (login, signup)
  - `(app)/(tabs)/` - Main app with bottom tab navigation (Home, Events, Favorites, Profile)
  - `chat-search.tsx` - Chat/search functionality
- `components/` - Reusable UI components
  - `ui/` - Base UI components (button, card, input, etc.)
  - `chat/` - Chat-specific components
  - `home/` - Home screen components
- `lib/` - Core application logic
  - `contexts/auth.tsx` - Authentication context and routing logic
  - `services/` - API service classes (auth, chat, location, suggestions)
  - `types/` - TypeScript type definitions
  - `storage.ts` - Secure storage utilities
  - `theme.ts` - Navigation theme configuration
  - `config.ts` - API configuration

### Authentication Flow

The app uses a custom authentication system with:
- Context-based auth state management (`lib/contexts/auth.tsx`)
- Automatic navigation routing based on auth status
- Secure token storage using expo-secure-store
- API service with automatic token handling

### Styling System

- **NativeWind** for Tailwind CSS in React Native
- **shadcn/ui** design system adapted for React Native
- CSS variables for theming in `global.css`
- Dark/light theme support with automatic color scheme detection

### Key Configuration Files

- `tailwind.config.js` - Tailwind CSS configuration with custom color system
- `babel.config.js` - Babel preset for Expo with NativeWind
- `metro.config.js` - Metro bundler configuration for NativeWind
- `tsconfig.json` - TypeScript configuration with strict mode

## Development Notes

- Uses React Native Reusables component library for UI consistency
- Components follow a consistent file structure with separate UI primitives
- All API calls go through service classes in `lib/services/`
- Type definitions are centralized in `lib/types/`
- Uses Expo Router for file-based navigation
- Supports iOS, Android, and Web platforms

## Adding Components

Use the React Native Reusables CLI to add new UI components:
```bash
npx react-native-reusables/cli@latest add [...components]
```