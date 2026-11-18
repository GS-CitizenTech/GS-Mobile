import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  DashboardScreen,
  AlertsScreen,
  AlertDetailsScreen,
  PointsScreen,
  PointDetailsScreen,
  ReadingsScreen,
  ReadingDetailsScreen,
  ProfileScreen,
  AboutScreen,
} from '../screens/AppScreens';
import ManagerRegisterScreen from '../screens/ManagerRegisterScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import ManagerDashboardScreen from '../screens/ManagerDashboardScreen';
import ManagerRequestsScreen from '../screens/ManagerRequestsScreen';
import ManagerRequestStatusScreen from '../screens/ManagerRequestStatusScreen';
import { ManagerPointsScreen, ManagerReadingsScreen, ManagerAlertsScreen } from '../screens/ManagerDataScreens';
import {
  OccurrencesScreen,
  OccurrenceFormScreen,
  OccurrenceDetailsScreen,
} from '../screens/OccurrenceScreens';
import colors from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabIcons = {
  'Início': '⌂',
  Alertas: '⚠',
  Pontos: '⌖',
  Leituras: '≋',
  'Ocorrências': '▤',
  Gestão: '⚙',
  Perfil: '●',
};

function TabIcon({ routeName, focused }) {
  useTheme();
  return (
    <Text
      accessibilityElementsHidden
      style={{
        color: focused ? colors.primary : colors.textSecondary,
        fontSize: 21,
        fontWeight: focused ? '900' : '600',
        lineHeight: 24,
      }}
    >
      {tabIcons[routeName] || '•'}
    </Text>
  );
}

function MainTabs({ user, onLogout }) {
  useTheme();
  return (
    <Tab.Navigator
      initialRouteName="Início"
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '800', color: colors.text },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 9,
          paddingTop: 7,
          elevation: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
        tabBarIconStyle: { marginTop: 1 },
      }}
    >
      <Tab.Screen
        name="Início"
        component={DashboardScreen}
        options={{
          title: 'Início',
          tabBarLabel: 'Início',
          tabBarIcon: ({ focused }) => <TabIcon routeName="Início" focused={focused} />,
        }}
      />

      <Tab.Screen
        name="Alertas"
        component={AlertsScreen}
        options={{
          title: 'Alertas',
          tabBarLabel: 'Alertas',
          tabBarIcon: ({ focused }) => <TabIcon routeName="Alertas" focused={focused} />,
        }}
      />

      <Tab.Screen
        name="Pontos"
        component={PointsScreen}
        options={{
          title: 'Monitoramento',
          tabBarLabel: 'Pontos',
          tabBarIcon: ({ focused }) => <TabIcon routeName="Pontos" focused={focused} />,
        }}
      />

      <Tab.Screen
        name="Leituras"
        component={ReadingsScreen}
        options={{
          title: 'Leituras',
          tabBarLabel: 'Leituras',
          tabBarIcon: ({ focused }) => <TabIcon routeName="Leituras" focused={focused} />,
        }}
      />

      <Tab.Screen
        name="Ocorrências"
        options={{
          title: 'Ocorrências',
          tabBarLabel: 'Ocorrências',
          tabBarIcon: ({ focused }) => <TabIcon routeName="Ocorrências" focused={focused} />,
        }}
      >
        {(props) => <OccurrencesScreen {...props} user={user} />}
      </Tab.Screen>

      {String(user?.perfil || '').toUpperCase() === 'GESTOR' ? (
        <Tab.Screen
          name="Gestão"
          options={{
            title: 'Painel do gestor',
            tabBarLabel: 'Gestão',
            tabBarIcon: ({ focused }) => <TabIcon routeName="Gestão" focused={focused} />,
          }}
        >
          {(props) => <ManagerDashboardScreen {...props} user={user} />}
        </Tab.Screen>
      ) : null}

      <Tab.Screen
        name="Perfil"
        options={{
          title: 'Meu perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon routeName="Perfil" focused={focused} />,
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
  useTheme();
  const isManager = String(user?.perfil || '').toUpperCase() === 'GESTOR';

  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '800', color: colors.text },
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
        name="PointDetails"
        component={PointDetailsScreen}
        options={{ title: 'Detalhes do ponto' }}
      />

      <Stack.Screen
        name="ReadingDetails"
        component={ReadingDetailsScreen}
        options={{ title: 'Detalhes da leitura' }}
      />

      <Stack.Screen
        name="OccurrenceForm"
        options={{ title: 'Registrar ocorrência' }}
      >
        {(props) => <OccurrenceFormScreen {...props} user={user} />}
      </Stack.Screen>

      <Stack.Screen
        name="OccurrenceDetails"
        options={{ title: 'Detalhes da ocorrência' }}
      >
        {(props) => <OccurrenceDetailsScreen {...props} user={user} />}
      </Stack.Screen>

      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: 'Sobre o aplicativo' }}
      />

      <Stack.Screen
        name="ManagerRequestStatus"
        component={ManagerRequestStatusScreen}
        options={{ title: 'Acesso de gestor' }}
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
          <Stack.Screen name="ManagerRequests" component={ManagerRequestsScreen} options={{ title: 'Solicitações de gestor' }} />
          <Stack.Screen name="ManagePoints" component={ManagerPointsScreen} options={{ title: 'Gerenciar pontos' }} />
          <Stack.Screen name="ManageReadings" component={ManagerReadingsScreen} options={{ title: 'Gerenciar leituras' }} />
          <Stack.Screen name="ManageAlerts" component={ManagerAlertsScreen} options={{ title: 'Gerenciar alertas' }} />
        </>
      ) : null}
    </Stack.Navigator>
  );
}
