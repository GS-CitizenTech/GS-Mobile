import { useEffect } from 'react';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import { checkApiConnection } from './src/services/connectionService';

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
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}