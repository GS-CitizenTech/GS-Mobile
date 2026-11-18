import { useEffect, useMemo } from 'react';

import {
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { checkApiConnection } from './src/services/connectionService';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

function AppContent() {
  const { colors, isDark } = useTheme();
  const navigationTheme = useMemo(() => ({
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  }), [colors, isDark]);

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <NavigationContainer theme={navigationTheme}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  useEffect(() => {
    let isMounted = true;

    async function testConnection() {
      const result = await checkApiConnection();

      if (isMounted) {
        if (result.success) {
          console.log('================================');
          console.log('API CONECTADA COM SUCESSO');
          console.log('Status:', result.status);
          console.log(result.message);
          console.log('================================');
        } else {
          console.log('================================');
          console.log('FALHA NA CONEXÃO COM A API');
          console.log('Status:', result.status);
          console.log(result.message);
          console.log('================================');
        }
      }
    }

    testConnection();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}