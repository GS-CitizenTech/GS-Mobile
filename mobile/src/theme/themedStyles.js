import { StyleSheet } from 'react-native';
import { getActiveColors, getThemeVersion } from './colors';

// Rebuilds the StyleSheet only when the selected theme changes.
export function createThemedStyles(factory) {
  let cachedVersion = -1;
  let cachedStyles = null;

  return new Proxy({}, {
    get(_target, property) {
      const version = getThemeVersion();
      if (!cachedStyles || cachedVersion !== version) {
        cachedStyles = StyleSheet.create(factory(getActiveColors()));
        cachedVersion = version;
      }
      return cachedStyles[property];
    },
  });
}
