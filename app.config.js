// Native Maps SDK key is embedded during prebuild, never hard-coded in Git.
module.exports = ({ config }) => {
  const mapsKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  return {
    ...config,
    android: {
      ...config.android,
      permissions: [...new Set([...(config.android?.permissions || []), 'android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION'])],
      ...(mapsKey ? { config: { ...config.android?.config, googleMaps: { apiKey: mapsKey } } } : {}),
    },
  };
};
