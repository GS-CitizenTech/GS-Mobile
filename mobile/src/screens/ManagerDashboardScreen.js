import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import AppScreen from '../components/AppScreen';
import colors from '../theme/colors';
import { listarAlertas } from '../services/alertaService';
import { listarTodosPontosMonitoramento } from '../services/pontoMonitoramentoService';
import { listarLeiturasEnchente } from '../services/leituraEnchenteService';
import { listarOcorrencias } from '../services/ocorrenciaService';
import { listarSolicitacoesGestor } from '../services/usuarioService';
import { getApiErrorMessage } from '../services/apiError';

function MetricCard({ title, value, detail }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

function ActionCard({ icon, title, description, onPress }) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.actionIcon}><Text style={styles.actionIconText}>{icon}</Text></View>
      <View style={styles.actionBody}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function ManagerDashboardScreen({ navigation, user }) {
  const [metrics, setMetrics] = useState({ alerts: 0, points: 0, readings: 0, occurrences: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const results = await Promise.allSettled([
        listarAlertas(),
        listarTodosPontosMonitoramento(),
        listarLeiturasEnchente(),
        listarOcorrencias(),
        listarSolicitacoesGestor('PENDENTE'),
      ]);
      const values = results.map((result) => result.status === 'fulfilled' ? result.value : []);
      const failures = results.filter((result) => result.status === 'rejected');
      setMetrics({
        alerts: values[0].length,
        points: values[1].length,
        readings: values[2].length,
        occurrences: values[3].length,
        pending: values[4].length,
      });
      if (failures.length) {
        setError('Alguns indicadores não puderam ser carregados. Verifique sua conexão e atualize o painel.');
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadDashboard();
  }, [loadDashboard]));

  return (
    <AppScreen
      title="Painel do gestor"
      subtitle={`Bem-vindo(a), ${user?.nome || 'gestor'}. Gerencie os dados e acompanhe a operação do Alerta Cidadão.`}
    >
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>🛡️</Text>
        <View style={styles.bannerBody}>
          <Text style={styles.bannerTitle}>Área administrativa</Text>
          <Text style={styles.bannerText}>As ações deste painel exigem uma conta autenticada com perfil GESTOR.</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Visão geral</Text>
        <TouchableOpacity onPress={loadDashboard} disabled={loading}>
          <Text style={styles.refreshText}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Carregando indicadores...</Text>
        </View>
      ) : (
        <View style={styles.metricsGrid}>
          <MetricCard title="Alertas" value={metrics.alerts} detail="Registros" />
          <MetricCard title="Pontos" value={metrics.points} detail="Ativos e inativos" />
          <MetricCard title="Leituras" value={metrics.readings} detail="Medições" />
          <MetricCard title="Ocorrências" value={metrics.occurrences} detail="Relatos recebidos" />
        </View>
      )}
      {error ? <Text style={styles.warningText}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Gerenciar módulos</Text>
      <ActionCard icon="⚠️" title="Alertas" description="Cadastrar, editar, resolver ou excluir alertas." onPress={() => navigation.navigate('ManageAlerts')} />
      <ActionCard icon="📍" title="Pontos de monitoramento" description="Cadastrar, editar e desativar pontos e coordenadas." onPress={() => navigation.navigate('ManagePoints')} />
      <ActionCard icon="🌊" title="Leituras de enchente" description="Registrar, corrigir e excluir medições." onPress={() => navigation.navigate('ManageReadings')} />
      <ActionCard icon="📋" title="Ocorrências" description="Analisar relatos e atualizar seus status." onPress={() => navigation.navigate('Ocorrências')} />

      <Text style={styles.sectionTitle}>Acesso e usuários</Text>
      <ActionCard icon="🛡️" title="Solicitações de gestor" description={`${metrics.pending} solicitação(ões) aguardando análise.`} onPress={() => navigation.navigate('ManagerRequests')} />
      <ActionCard icon="👥" title="Gerenciar usuários" description="Consultar e desativar contas cadastradas." onPress={() => navigation.navigate('UsersManagement')} />
      <ActionCard icon="➕" title="Cadastrar outro gestor" description="Criar uma conta administrativa para outro responsável." onPress={() => navigation.navigate('ManagerRegister')} />

      <Text style={styles.footerNote}>O acesso de gestor não pode ser concedido pela própria tela de cadastro. Novos pedidos precisam ser aprovados por um gestor existente.</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: colors.primaryLight, borderRadius: 14, marginBottom: 18 },
  bannerIcon: { fontSize: 30, marginRight: 12 },
  bannerBody: { flex: 1 },
  bannerTitle: { color: colors.primaryDark, fontWeight: '800', fontSize: 15 },
  bannerText: { color: colors.primaryDark, fontSize: 12, lineHeight: 18, marginTop: 5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 14, marginBottom: 10 },
  refreshText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  loadingState: { padding: 22, alignItems: 'center' },
  helperText: { color: colors.textSecondary, marginTop: 8, fontSize: 12 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: '48%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: 13, borderWidth: 1, borderColor: colors.border, padding: 14 },
  metricValue: { fontSize: 25, fontWeight: '900', color: colors.primary },
  metricTitle: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 3 },
  metricDetail: { fontSize: 11, color: colors.textSecondary, marginTop: 3 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 13, marginBottom: 9 },
  actionIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  actionIconText: { fontSize: 20 },
  actionBody: { flex: 1 },
  actionTitle: { color: colors.text, fontWeight: '800', fontSize: 13 },
  actionDescription: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 4 },
  chevron: { color: colors.primary, fontWeight: '800', fontSize: 24, paddingLeft: 7 },
  warningText: { color: colors.warning, fontSize: 12, lineHeight: 18, marginTop: 10 },
  footerNote: { color: colors.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 14, marginBottom: 8 },
});
