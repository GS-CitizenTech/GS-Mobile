import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { logout, restoreSession } from '../services/authService';
import { setUnauthorizedHandler } from '../services/sessionEvents';
import colors from '../theme/colors';

export default function RootNavigator() {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      try {
        const session = await restoreSession();

        if (isMounted && session) {
          setUser(session.user);
        }
      } catch (error) {
        console.error('Erro ao recuperar a sessão:', error);

        try {
          await logout();
        } catch (storageError) {
          console.error('Erro ao limpar sessão inválida:', storageError);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    initializeSession();

    const unsubscribe = setUnauthorizedHandler(() => {
      if (isMounted) {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  function handleAuthenticated(authenticatedUser) {
    setUser(authenticatedUser);
  }

  async function handleLogout() {
    // Só encerra a navegação após confirmar a remoção local da sessão.
    await logout();
    setUser(null);
  }

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Verificando sua sessão...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthNavigator onAuthenticated={handleAuthenticated} />;
  }

  return (
    <AppNavigator
      user={user}
      onLogout={handleLogout}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
});
