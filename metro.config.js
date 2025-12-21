const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Override resolveRequest to handle react-native-maps on web
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // On web, redirect react-native-maps to our shim before Metro tries to resolve it
  if (platform === 'web' && moduleName === 'react-native-maps') {
    const shimPath = path.resolve(__dirname, 'lib', 'shims', 'react-native-maps-web.js');
    return {
      filePath: shimPath,
      type: 'sourceFile',
    };
  }

  // Use the default resolver for all other cases
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  
  // Fallback: use Metro's default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
