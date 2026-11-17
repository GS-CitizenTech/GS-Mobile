import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  DashboardScreen,
  AlertsScreen,
  AlertDetailsScreen,
  PointsScreen,
  ReadingsScreen,
  ProfileScreen,
  AboutScreen,
} from '../screens/AppScreens';
import ManagerRegisterScreen from '../screens/ManagerRegisterScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import colors from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs({ user, onLogout }) {
  return (
    <Tab.Navigator
      initialRouteName="Início"
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Início"
        component={DashboardScreen}
        options={{
          title: 'Início',
          tabBarLabel: 'Início',
          tabBarIcon: () => null,
        }}
      />

      <Tab.Screen
        name="Alertas"
        component={AlertsScreen}
        options={{
          title: 'Alertas',
          tabBarLabel: 'Alertas',
          tabBarIcon: () => null,
        }}
      />

      <Tab.Screen
        name="Pontos"
        component={PointsScreen}
        options={{
          title: 'Monitoramento',
          tabBarLabel: 'Pontos',
          tabBarIcon: () => null,
        }}
      />

      <Tab.Screen
        name="Leituras"
        component={ReadingsScreen}
        options={{
          title: 'Leituras',
          tabBarLabel: 'Leituras',
          tabBarIcon: () => null,
        }}
      />

      <Tab.Screen
        name="Perfil"
        options={{
          title: 'Meu perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: () => null,
        }}
      >
        {(props) => (
          <ProfileScreen
            {...props}
            user={user}
            onLogout={onLogout}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function AppNavigator({ user, onLogout }) {
  const isManager = String(user?.perfil || '').toUpperCase() === 'GESTOR';

  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Main" options={{ headerShown: false }}>
        {(props) => (
          <MainTabs
            {...props}
            user={user}
            onLogout={onLogout}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="AlertDetails"
        component={AlertDetailsScreen}
        options={{ title: 'Detalhes do alerta' }}
      />

      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: 'Sobre o aplicativo' }}
      />

      {isManager ? (
        <>
          <Stack.Screen
            name="ManagerRegister"
            component={ManagerRegisterScreen}
            options={{ title: 'Cadastrar gestor' }}
          />
          <Stack.Screen
            name="UsersManagement"
            options={{ title: 'Gerenciar usuários' }}
          >
            {(props) => <UserManagementScreen {...props} user={user} />}
          </Stack.Screen>
        </>
      ) : null}
    </Stack.Navigator>
  );
}
