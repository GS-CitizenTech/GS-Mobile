import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  LoginScreen,
  RegisterScreen,
} from '../screens/AuthScreens';

import colors from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function AuthNavigator({ onDemoLogin }) {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="Login"
        options={{
          headerShown: false,
        }}
      >
        {(props) => (
          <LoginScreen
            {...props}
            onDemoLogin={onDemoLogin}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: 'Criar conta',
        }}
      />
    </Stack.Navigator>
  );
}