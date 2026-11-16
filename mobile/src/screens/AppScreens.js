import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import AppScreen from '../components/AppScreen';
import colors from '../theme/colors';

function InfoCard({ title, value, description, color }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>{title}</Text>

      <Text style={[styles.cardValue, color ? { color } : null]}>
        {value}
      </Text>

      <Text style={styles.cardDescription}>
        {description}
      </Text>
    </View>
  );
}

function AlertCard({ item, onPress }) {
  return (
    <TouchableOpacity
      style={styles.alertCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.alertHeader}>
        <Text style={styles.alertTitle}>{item.title}</Text>

        <Text
          style={[
            styles.alertStatus,
            item.level === 'CRITICO'
              ? styles.critical
              : item.level === 'ALTO'
                ? styles.high
                : styles.moderate,
          ]}
        >
          {item.level}
        </Text>
      </View>

      <Text style={styles.alertDescription}>
        {item.description}
      </Text>

      <Text style={styles.alertLocation}>
        📍 {item.location}
      </Text>

      <Text style={styles.detailsLink}>
        Ver detalhes →
      </Text>
    </TouchableOpacity>
  );
}

const sampleAlerts = [
  {
    id: '1',
    title: 'Atenção para alagamento',
    level: 'ALTO',
    description: 'Aumento do nível da água identificado na região.',
    location: 'Região Central',
  },
  {
    id: '2',
    title: 'Monitoramento preventivo',
    level: 'MODERADO',
    description: 'Condições que exigem atenção dos moradores.',
    location: 'Zona Norte',
  },
  {
    id: '3',
    title: 'Risco de inundação',
    level: 'CRITICO',
    description: 'Região com risco elevado de inundação.',
    location: 'Zona Sul',
  },
];

export function DashboardScreen({ navigation }) {
  return (
    <AppScreen
      title="Olá, cidadão!"
      subtitle="Acompanhe as condições de monitoramento da sua região."
    >
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>🌧️</Text>

        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>
            Fique atento!
          </Text>

          <Text style={styles.bannerDescription}>
            Acompanhe os alertas e procure informações oficiais antes de se deslocar.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Resumo do monitoramento
      </Text>

      <InfoCard
        title="Alertas ativos"
        value="03"
        description="Dados demonstrativos"
        color={colors.danger}
      />

      <InfoCard
        title="Pontos monitorados"
        value="12"
        description="Dados demonstrativos"
        color={colors.primary}
      />

      <InfoCard
        title="Leituras registradas"
        value="48"
        description="Dados demonstrativos"
        color={colors.secondary}
      />

      <Text style={styles.sectionTitle}>
        Alertas recentes
      </Text>

      {sampleAlerts.slice(0, 2).map((item) => (
        <AlertCard
          key={item.id}
          item={item}
          onPress={() =>
            navigation.navigate('AlertDetails', { alert: item })
          }
        />
      ))}

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('Alertas')}
      >
        <Text style={styles.secondaryButtonText}>
          Ver todos os alertas
        </Text>
      </TouchableOpacity>
    </AppScreen>
  );
}

export function AlertsScreen({ navigation }) {
  return (
    <AppScreen
      title="Alertas"
      subtitle="Consulte os avisos e níveis de risco registrados."
    >
      {sampleAlerts.map((item) => (
        <AlertCard
          key={item.id}
          item={item}
          onPress={() =>
            navigation.navigate('AlertDetails', { alert: item })
          }
        />
      ))}
    </AppScreen>
  );
}

export function AlertDetailsScreen({ route }) {
  const alert = route.params?.alert;

  return (
    <AppScreen
      title="Detalhes do alerta"
      subtitle="Informações sobre a situação monitorada."
    >
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>
          {alert?.title || 'Alerta não encontrado'}
        </Text>

        <Text style={styles.detailLevel}>
          Classificação: {alert?.level || 'Não informado'}
        </Text>

        <Text style={styles.detailText}>
          {alert?.description || 'Nenhuma descrição disponível.'}
        </Text>

        <Text style={styles.detailText}>
          Localização: {alert?.location || 'Não informada'}
        </Text>

        <Text style={styles.notice}>
          As informações exibidas nesta versão são demonstrativas.
          Os dados oficiais serão carregados da API.
        </Text>
      </View>
    </AppScreen>
  );
}

export function PointsScreen() {
  const points = [
    { id: 1, name: 'Ponto Central', location: 'Região Central' },
    { id: 2, name: 'Ponto Norte', location: 'Zona Norte' },
    { id: 3, name: 'Ponto Sul', location: 'Zona Sul' },
  ];

  return (
    <AppScreen
      title="Monitoramento"
      subtitle="Consulte os pontos de acompanhamento de enchentes."
    >
      {points.map((point) => (
        <View key={point.id} style={styles.pointCard}>
          <Text style={styles.pointTitle}>
            📍 {point.name}
          </Text>

          <Text style={styles.pointLocation}>
            {point.location}
          </Text>

          <Text style={styles.pointStatus}>
            ● Ponto demonstrativo
          </Text>
        </View>
      ))}
    </AppScreen>
  );
}

export function ReadingsScreen() {
  const readings = [
    { id: 1, level: '1,20 m', rain: '15 mm', date: 'Leitura demonstrativa 1' },
    { id: 2, level: '0,85 m', rain: '10 mm', date: 'Leitura demonstrativa 2' },
    { id: 3, level: '1,50 m', rain: '25 mm', date: 'Leitura demonstrativa 3' },
  ];

  return (
    <AppScreen
      title="Leituras"
      subtitle="Histórico de medições dos pontos de monitoramento."
    >
      {readings.map((reading) => (
        <View key={reading.id} style={styles.readingCard}>
          <Text style={styles.readingTitle}>
            {reading.date}
          </Text>

          <Text style={styles.readingValue}>
            Nível da água: {reading.level}
          </Text>

          <Text style={styles.readingValue}>
            Volume de chuva: {reading.rain}
          </Text>
        </View>
      ))}
    </AppScreen>
  );
}

export function ProfileScreen({ navigation, onLogout }) {
  return (
    <AppScreen
      title="Meu perfil"
      subtitle="Informações da sua conta."
    >
      <View style={styles.profileCard}>
        <Text style={styles.profileIcon}>👤</Text>

        <Text style={styles.profileName}>
          Cidadão de demonstração
        </Text>

        <Text style={styles.profileEmail}>
          A autenticação será integrada à API.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('About')}
      >
        <Text style={styles.secondaryButtonText}>
          Sobre o aplicativo
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onLogout}
      >
        <Text style={styles.logoutText}>
          Sair da demonstração
        </Text>
      </TouchableOpacity>
    </AppScreen>
  );
}

export function AboutScreen() {
  return (
    <AppScreen
      title="Sobre o aplicativo"
      subtitle="Conheça o Alerta Cidadão."
    >
      <View style={styles.detailCard}>
        <Text style={styles.aboutName}>
          🌊 Alerta Cidadão
        </Text>

        <Text style={styles.detailText}>
          Aplicativo desenvolvido para facilitar o acesso a informações
          sobre monitoramento de enchentes e alertas de risco.
        </Text>

        <Text style={styles.detailText}>
          Projeto acadêmico — Global Solution 2026/2.
        </Text>

        <Text style={styles.notice}>
          O hash do commit de referência será inserido nesta tela
          na etapa de publicação.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.primaryLight,
    borderRadius: 15,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  bannerIcon: {
    fontSize: 38,
    marginRight: 12,
  },

  bannerContent: {
    flex: 1,
  },

  bannerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 5,
  },

  bannerDescription: {
    color: colors.primaryDark,
    fontSize: 13,
    lineHeight: 19,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 13,
    marginTop: 8,
  },

  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 17,
    marginBottom: 12,
  },

  cardTitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  cardValue: {
    color: colors.text,
    fontSize: 27,
    fontWeight: 'bold',
    marginVertical: 5,
  },

  cardDescription: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  alertCard: {
    backgroundColor: colors.surface,
    padding: 17,
    borderRadius: 13,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },

  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },

  alertTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },

  alertStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    padding: 7,
    borderRadius: 7,
    overflow: 'hidden',
  },

  critical: {
    color: colors.critical,
    backgroundColor: colors.criticalLight,
  },

  high: {
    color: colors.danger,
    backgroundColor: colors.dangerLight,
  },

  moderate: {
    color: colors.warning,
    backgroundColor: colors.warningLight,
  },

  alertDescription: {
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 20,
  },

  alertLocation: {
    color: colors.textSecondary,
    marginTop: 10,
  },

  detailsLink: {
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 13,
  },

  secondaryButton: {
    backgroundColor: colors.primaryLight,
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 12,
  },

  secondaryButtonText: {
    color: colors.primaryDark,
    fontWeight: 'bold',
  },

  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  detailTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },

  detailLevel: {
    fontWeight: 'bold',
    color: colors.danger,
    marginBottom: 15,
  },

  detailText: {
    color: colors.textSecondary,
    lineHeight: 23,
    marginBottom: 15,
  },

  notice: {
    color: colors.warning,
    backgroundColor: colors.warningLight,
    padding: 12,
    borderRadius: 9,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },

  pointCard: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 13,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },

  pointTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
  },

  pointLocation: {
    color: colors.textSecondary,
    marginTop: 8,
  },

  pointStatus: {
    color: colors.secondary,
    fontSize: 12,
    marginTop: 12,
  },

  readingCard: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 13,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },

  readingTitle: {
    fontWeight: 'bold',
    color: colors.text,
    fontSize: 16,
    marginBottom: 12,
  },

  readingValue: {
    color: colors.textSecondary,
    marginBottom: 7,
  },

  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  profileIcon: {
    fontSize: 60,
    marginBottom: 12,
  },

  profileName: {
    fontWeight: 'bold',
    fontSize: 18,
    color: colors.text,
  },

  profileEmail: {
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },

  logoutButton: {
    backgroundColor: colors.dangerLight,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },

  logoutText: {
    color: colors.danger,
    fontWeight: 'bold',
  },

  aboutName: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});