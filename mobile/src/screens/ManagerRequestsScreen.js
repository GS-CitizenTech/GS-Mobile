import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import AppScreen from '../components/AppScreen';
import colors from '../theme/colors';
import { createThemedStyles } from '../theme/themedStyles';
import { useTheme } from '../theme/ThemeContext';
import { decidirSolicitacaoGestor, listarSolicitacoesGestor } from '../services/usuarioService';
import { getApiErrorMessage } from '../services/apiError';

function formatDate(value) {
  if (!value) return 'Não informada';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Não informada' : date.toLocaleString('pt-BR');
}

export default function ManagerRequestsScreen() {
  useTheme();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRequests(await listarSolicitacoesGestor('PENDENTE'));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadRequests();
  }, [loadRequests]));

  function handleDecision(item, status) {
    const approved = status === 'APROVADA';
    Alert.alert(
      approved ? 'Aprovar gestor' : 'Rejeitar solicitação',
      approved
        ? `Aprovar ${item.nomeUsuario} como gestor? A conta receberá acesso administrativo após novo login.`
        : `Rejeitar a solicitação de ${item.nomeUsuario}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: approved ? 'Aprovar' : 'Rejeitar',
          style: approved ? 'default' : 'destructive',
          onPress: async () => {
            setBusyId(item.idSolicitacaoGestor);
            try {
              await decidirSolicitacaoGestor(item.idSolicitacaoGestor, { status });
              await loadRequests();
              Alert.alert('Decisão registrada', approved
                ? 'O usuário agora possui perfil GESTOR. Ele precisa entrar novamente para receber as permissões.'
                : 'A solicitação foi rejeitada.');
            } catch (requestError) {
              Alert.alert('Não foi possível concluir', getApiErrorMessage(requestError));
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  }

  return (
    <AppScreen title="Solicitações de gestor" subtitle="Analise os pedidos de usuários que solicitaram acesso administrativo.">
      <TouchableOpacity style={styles.refreshButton} onPress={loadRequests} disabled={loading || busyId !== null}>
        <Text style={styles.refreshText}>Atualizar solicitações</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.state}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.helper}>Carregando solicitações...</Text></View>
      ) : error ? (
        <View style={styles.emptyCard}><Text style={styles.errorText}>{error}</Text></View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyCard}><Text style={styles.emptyTitle}>Nenhuma solicitação pendente</Text><Text style={styles.helper}>Quando um usuário solicitar acesso de gestor, o pedido aparecerá aqui.</Text></View>
      ) : requests.map((item) => (
        <View key={item.idSolicitacaoGestor} style={styles.requestCard}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{item.nomeUsuario}</Text>
            <Text style={styles.pending}>PENDENTE</Text>
          </View>
          <Text style={styles.email}>{item.emailUsuario}</Text>
          {item.telefoneUsuario ? <Text style={styles.meta}>Telefone: {item.telefoneUsuario}</Text> : null}
          <Text style={styles.meta}>Solicitado em: {formatDate(item.dataSolicitacao)}</Text>
          <Text style={styles.reasonLabel}>Motivo informado</Text>
          <Text style={styles.reason}>{item.motivo}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.approveButton} onPress={() => handleDecision(item, 'APROVADA')} disabled={busyId !== null}>
              {busyId === item.idSolicitacaoGestor ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.approveText}>Aprovar</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={() => handleDecision(item, 'REJEITADA')} disabled={busyId !== null}>
              <Text style={styles.rejectText}>Rejeitar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </AppScreen>
  );
}

const styles = createThemedStyles(() => ({
  refreshButton: { alignSelf: 'flex-start', backgroundColor: colors.primaryLight, borderRadius: 9, paddingHorizontal: 13, paddingVertical: 10, marginBottom: 14 },
  refreshText: { color: colors.primaryDark, fontWeight: '800', fontSize: 12 },
  state: { alignItems: 'center', padding: 25 },
  helper: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 8 },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 18 },
  emptyTitle: { color: colors.text, fontWeight: '800', fontSize: 15 },
  errorText: { color: colors.danger, lineHeight: 19 },
  requestCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 15, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '800' },
  pending: { color: colors.warning, backgroundColor: colors.warningLight, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, fontSize: 9, fontWeight: '900' },
  email: { color: colors.primary, fontSize: 12, marginTop: 7 },
  meta: { color: colors.textSecondary, fontSize: 11, marginTop: 6 },
  reasonLabel: { color: colors.text, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginTop: 14 },
  reason: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 5 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 15 },
  approveButton: { flex: 1, minHeight: 43, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  approveText: { color: colors.textLight, fontWeight: '800', fontSize: 12 },
  rejectButton: { flex: 1, minHeight: 43, borderRadius: 9, borderWidth: 1, borderColor: colors.danger, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dangerLight },
  rejectText: { color: colors.danger, fontWeight: '800', fontSize: 12 },
}));
