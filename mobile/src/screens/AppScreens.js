import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import AppScreen from '../components/AppScreen';
import colors from '../theme/colors';
import { listarAlertas, obterAlertaPorId } from '../services/alertaService';
import { getApiErrorMessage } from '../services/apiError';

function InfoCard({ title, value, description, color }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.cardValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </View>
  );
}

function formatarData(data) {
  if (!data) return 'Não informada';
  const valor = new Date(data);
  if (Number.isNaN(valor.getTime())) return 'Não informada';
  return valor.toLocaleString('pt-BR');
}

function tituloClassificacao(classificacao) {
  const nomes = {
    BAIXO: 'Risco baixo',
    MODERADO: 'Risco moderado',
    ALTO: 'Risco alto',
    CRITICO: 'Risco crítico',
  };
  return nomes[String(classificacao || '').toUpperCase()] || 'Alerta de monitoramento';
}

function AlertCard({ item, onPress }) {
  const classificacao = String(item.classificacao || '').toUpperCase();
  const status = String(item.status || '').toUpperCase();

  return (
    <TouchableOpacity
      style={styles.alertCard}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Abrir alerta ${item.idAlerta}, ${tituloClassificacao(classificacao)}`}
    >
      <View style={styles.alertHeader}>
        <Text style={styles.alertTitle}>{tituloClassificacao(classificacao)}</Text>
        <Text
          style={[
            styles.alertStatus,
            classificacao === 'CRITICO'
              ? styles.critical
              : classificacao === 'ALTO'
                ? styles.high
                : classificacao === 'BAIXO'
                  ? styles.low
                  : styles.moderate,
          ]}
        >
          {classificacao || 'SEM CLASSIFICAÇÃO'}
        </Text>
      </View>

      <Text style={styles.alertDescription} numberOfLines={3}>
        {item.mensagemExplicativa || 'Não há uma explicação adicional cadastrada para este alerta.'}
      </Text>

      <View style={styles.alertMetadata}>
        <Text style={styles.alertLocation}>Leitura #{item.idLeitura}</Text>
        <Text style={styles.alertStatusText}>
          {status === 'RESOLVIDO' ? 'Resolvido' : 'Ativo'}
        </Text>
      </View>

      <Text style={styles.alertDate}>Gerado em {formatarData(item.dataGeracao)}</Text>
      <Text style={styles.detailsLink}>Ver detalhes →</Text>
    </TouchableOpacity>
  );
}

function LoadingState({ message = 'Carregando alertas...' }) {
  return (
    <View style={styles.stateContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.stateText}>{message}</Text>
    </View>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.stateCard}>
      <Text style={styles.stateTitle}>Não foi possível carregar</Text>
      <Text style={styles.stateText}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyState({ message }) {
  return (
    <View style={styles.stateCard}>
      <Text style={styles.stateTitle}>Nenhum alerta encontrado</Text>
      <Text style={styles.stateText}>{message}</Text>
    </View>
  );
}

export function DashboardScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listarAlertas();
      setAlerts(data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const activeAlerts = alerts.filter(
    (item) => String(item.status || '').toUpperCase() === 'ATIVO',
  );

  return (
    <AppScreen
      title="Olá, cidadão!"
      subtitle="Acompanhe as condições de monitoramento da sua região."
    >
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>🌧️</Text>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Fique atento!</Text>
          <Text style={styles.bannerDescription}>
            Acompanhe os alertas e procure informações oficiais antes de se deslocar.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Resumo do monitoramento</Text>
      {loading ? (
        <LoadingState message="Atualizando resumo dos alertas..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAlerts} />
      ) : (
        <InfoCard
          title="Alertas ativos"
          value={String(activeAlerts.length).padStart(2, '0')}
          description="Informações carregadas da API"
          color={activeAlerts.length > 0 ? colors.danger : colors.success}
        />
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Alertas recentes</Text>
        <TouchableOpacity onPress={loadAlerts}>
          <Text style={styles.refreshText}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <Text style={styles.inlineError}>Não foi possível carregar os alertas.</Text>
      ) : alerts.length === 0 ? (
        <EmptyState message="Não existem alertas cadastrados no momento." />
      ) : (
        alerts.slice(0, 2).map((item) => (
          <AlertCard
            key={item.idAlerta}
            item={item}
            onPress={() => navigation.navigate('AlertDetails', { id: item.idAlerta })}
          />
        ))
      )}

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('Alertas')}
      >
        <Text style={styles.secondaryButtonText}>Ver todos os alertas</Text>
      </TouchableOpacity>
    </AppScreen>
  );
}

export function AlertsScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listarAlertas(filter === 'TODOS' ? undefined : filter);
      setAlerts(data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  return (
    <AppScreen
      title="Alertas"
      subtitle="Consulte os avisos e níveis de risco registrados pela API."
    >
      <View style={styles.filterRow}>
        {[
          { label: 'Todos', value: 'TODOS' },
          { label: 'Ativos', value: 'ATIVO' },
          { label: 'Resolvidos', value: 'RESOLVIDO' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterButton,
              filter === option.value && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(option.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === option.value && styles.filterButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={loadAlerts}>
        <Text style={styles.refreshText}>↻ Atualizar alertas</Text>
      </TouchableOpacity>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAlerts} />
      ) : alerts.length === 0 ? (
        <EmptyState
          message={
            filter === 'TODOS'
              ? 'Ainda não existem alertas cadastrados.'
              : `Não existem alertas com status ${filter.toLowerCase()}.`
          }
        />
      ) : (
        alerts.map((item) => (
          <AlertCard
            key={item.idAlerta}
            item={item}
            onPress={() => navigation.navigate('AlertDetails', { id: item.idAlerta })}
          />
        ))
      )}
    </AppScreen>
  );
}

export function AlertDetailsScreen({ route }) {
  const initialAlert = route.params?.alert;
  const alertId = route.params?.id ?? initialAlert?.idAlerta ?? initialAlert?.id;
  const [alert, setAlert] = useState(initialAlert || null);
  const [loading, setLoading] = useState(Boolean(alertId));
  const [error, setError] = useState('');

  const loadAlert = useCallback(async () => {
    if (!alertId) {
      setError('O identificador do alerta não foi informado.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await obterAlertaPorId(alertId);
      setAlert(data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [alertId]);

  useEffect(() => {
    loadAlert();
  }, [loadAlert]);

  if (loading && !alert) {
    return (
      <AppScreen title="Detalhes do alerta">
        <LoadingState message="Carregando detalhes..." />
      </AppScreen>
    );
  }

  if (error && !alert) {
    return (
      <AppScreen title="Detalhes do alerta">
        <ErrorState message={error} onRetry={loadAlert} />
      </AppScreen>
    );
  }

  if (!alert) {
    return (
      <AppScreen title="Detalhes do alerta">
        <EmptyState message="O alerta solicitado não foi encontrado." />
      </AppScreen>
    );
  }

  const probability = alert.probabilidade == null
    ? 'Não informada'
    : `${(Number(alert.probabilidade) * 100).toFixed(1).replace('.', ',')}%`;

  return (
    <AppScreen
      title="Detalhes do alerta"
      subtitle="Informações retornadas pelo sistema de monitoramento."
    >
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>
          {tituloClassificacao(alert.classificacao)}
        </Text>

        <Text style={styles.detailLevel}>
          Classificação: {alert.classificacao || 'Não informada'}
        </Text>

        <Text style={styles.detailText}>
          Status: {String(alert.status || '').toUpperCase() === 'RESOLVIDO' ? 'Resolvido' : 'Ativo'}
        </Text>

        <Text style={styles.detailText}>
          {alert.mensagemExplicativa || 'Não há uma explicação adicional cadastrada para este alerta.'}
        </Text>

        <View style={styles.detailDivider} />
        <Text style={styles.detailLabel}>Identificação</Text>
        <Text style={styles.detailText}>Alerta: #{alert.idAlerta}</Text>
        <Text style={styles.detailText}>Leitura associada: #{alert.idLeitura}</Text>
        <Text style={styles.detailText}>Probabilidade: {probability}</Text>
        <Text style={styles.detailText}>Tipo de mensagem: {alert.tipoMensagem || 'Não informado'}</Text>
        <Text style={styles.detailText}>Modelo: {alert.modeloMl || 'Não informado'}</Text>

        <View style={styles.detailDivider} />
        <Text style={styles.detailLabel}>Datas</Text>
        <Text style={styles.detailText}>Geração: {formatarData(alert.dataGeracao)}</Text>
        <Text style={styles.detailText}>Resolução: {formatarData(alert.dataResolucao)}</Text>

        {error ? (
          <Text style={styles.notice}>
            Não foi possível atualizar os dados agora. As informações abaixo podem estar desatualizadas.
          </Text>
        ) : null}

        <Text style={styles.notice}>
          Consulte também os canais oficiais da Defesa Civil. Este aplicativo é uma ferramenta de apoio à informação e não substitui orientações das autoridades.
        </Text>

        <TouchableOpacity style={styles.refreshButton} onPress={loadAlert}>
          <Text style={styles.refreshText}>Atualizar detalhes</Text>
        </TouchableOpacity>
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
          <Text style={styles.pointTitle}>📍 {point.name}</Text>
          <Text style={styles.pointLocation}>{point.location}</Text>
          <Text style={styles.pointStatus}>● Ponto demonstrativo</Text>
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
          <Text style={styles.readingTitle}>{reading.date}</Text>
          <Text style={styles.readingValue}>Nível da água: {reading.level}</Text>
          <Text style={styles.readingValue}>Volume de chuva: {reading.rain}</Text>
        </View>
      ))}
    </AppScreen>
  );
}

export function ProfileScreen({ navigation, onLogout, user }) {
  const isManager = String(user?.perfil || '').toUpperCase() === 'GESTOR';

  async function handleLogout() {
    try {
      await onLogout();
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      Alert.alert(
        'Não foi possível sair',
        'O armazenamento seguro não confirmou a remoção da sessão. Tente novamente.',
      );
    }
  }

  return (
    <AppScreen title="Meu perfil" subtitle="Informações da sua conta.">
      <View style={styles.profileCard}>
        <Text style={styles.profileIcon}>👤</Text>
        <Text style={styles.profileName}>{user?.nome || 'Usuário'}</Text>
        <Text style={styles.profileEmail}>{user?.email || 'E-mail não informado'}</Text>
        <View style={styles.profileRole}>
          <Text style={styles.profileRoleText}>{isManager ? 'GESTOR' : 'CIDADÃO'}</Text>
        </View>
      </View>

      {isManager ? (
        <View style={styles.adminSection}>
          <Text style={styles.adminHeading}>Administração</Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('UsersManagement')}
          >
            <Text style={styles.secondaryButtonText}>Gerenciar usuários</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('ManagerRegister')}
          >
            <Text style={styles.secondaryButtonText}>Cadastrar novo gestor</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('About')}
      >
        <Text style={styles.secondaryButtonText}>Sobre o aplicativo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </AppScreen>
  );
}

export function AboutScreen() {
  return (
    <AppScreen title="Sobre o aplicativo" subtitle="Conheça o Alerta Cidadão.">
      <View style={styles.detailCard}>
        <Text style={styles.aboutName}>🌊 Alerta Cidadão</Text>
        <Text style={styles.detailText}>
          Aplicativo desenvolvido para facilitar o acesso a informações sobre monitoramento de enchentes e alertas de risco.
        </Text>
        <Text style={styles.detailText}>Projeto acadêmico — Global Solution 2026/2.</Text>
        <Text style={styles.notice}>
          O hash do commit de referência será inserido nesta tela na etapa de publicação.
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
  bannerIcon: { fontSize: 38, marginRight: 12 },
  bannerContent: { flex: 1 },
  bannerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 5,
  },
  bannerDescription: { color: colors.primaryDark, fontSize: 13, lineHeight: 19 },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 13,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 17,
    marginBottom: 12,
  },
  cardTitle: { color: colors.textSecondary, fontSize: 14 },
  cardValue: {
    color: colors.text,
    fontSize: 27,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  cardDescription: { color: colors.textSecondary, fontSize: 12 },
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
  critical: { color: colors.critical, backgroundColor: colors.criticalLight },
  high: { color: colors.danger, backgroundColor: colors.dangerLight },
  moderate: { color: colors.warning, backgroundColor: colors.warningLight },
  low: { color: colors.success, backgroundColor: colors.successLight },
  alertDescription: { color: colors.textSecondary, marginTop: 10, lineHeight: 20 },
  alertMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  alertLocation: { color: colors.textSecondary },
  alertStatusText: { color: colors.primary, fontWeight: 'bold', fontSize: 12 },
  alertDate: { color: colors.textSecondary, fontSize: 11, marginTop: 8 },
  detailsLink: { color: colors.primary, fontWeight: 'bold', marginTop: 13 },
  secondaryButton: {
    backgroundColor: colors.primaryLight,
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 12,
  },
  secondaryButtonText: { color: colors.primaryDark, fontWeight: 'bold' },
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
  detailLevel: { fontWeight: 'bold', color: colors.danger, marginBottom: 15 },
  detailText: { color: colors.textSecondary, lineHeight: 23, marginBottom: 12 },
  detailLabel: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 10,
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
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
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stateCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 18,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  stateTitle: { color: colors.text, fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  stateText: { color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 9,
    marginTop: 14,
  },
  retryButtonText: { color: colors.textLight, fontWeight: 'bold' },
  inlineError: { color: colors.danger, marginVertical: 8 },
  refreshButton: { alignSelf: 'flex-end', paddingVertical: 10, paddingHorizontal: 4 },
  refreshText: { color: colors.primary, fontWeight: 'bold' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  filterButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  filterButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterButtonText: { color: colors.textSecondary, fontWeight: '600', fontSize: 12 },
  filterButtonTextActive: { color: colors.textLight },
  pointCard: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 13,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pointTitle: { fontSize: 17, fontWeight: 'bold', color: colors.text },
  pointLocation: { color: colors.textSecondary, marginTop: 8 },
  pointStatus: { color: colors.secondary, fontSize: 12, marginTop: 12 },
  readingCard: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 13,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readingTitle: { fontWeight: 'bold', color: colors.text, fontSize: 16, marginBottom: 12 },
  readingValue: { color: colors.textSecondary, marginBottom: 7 },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileIcon: { fontSize: 60, marginBottom: 12 },
  profileName: { fontWeight: 'bold', fontSize: 18, color: colors.text },
  profileEmail: { color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  profileRole: {
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 13,
  },
  profileRoleText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  adminSection: { marginTop: 22 },
  adminHeading: { fontSize: 17, fontWeight: 'bold', color: colors.text, marginBottom: 3 },
  logoutButton: {
    backgroundColor: colors.dangerLight,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  logoutText: { color: colors.danger, fontWeight: 'bold' },
  aboutName: { fontSize: 22, color: colors.primary, fontWeight: 'bold', marginBottom: 20 },
});
