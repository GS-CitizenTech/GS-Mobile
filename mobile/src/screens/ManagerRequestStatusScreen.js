import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import AppScreen from '../components/AppScreen';
import colors from '../theme/colors';
import { obterMinhaSolicitacaoGestor, solicitarAcessoGestor } from '../services/usuarioService';
import { getApiErrorMessage } from '../services/apiError';

const STATUS_LABELS = {
  PENDENTE: 'Aguardando análise',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
};

export default function ManagerRequestStatusScreen() {
  const [request, setRequest] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadRequest = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRequest(await obterMinhaSolicitacaoGestor());
      setNotFound(false);
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        setRequest(null);
        setNotFound(true);
      } else {
        setError(getApiErrorMessage(requestError));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadRequest(); }, [loadRequest]));

  async function handleSubmit() {
    if (reason.trim().length < 10) {
      setError('Descreva sua necessidade em pelo menos 10 caracteres.');
      return;
    }
    if (reason.trim().length > 500) {
      setError('O motivo deve ter no máximo 500 caracteres.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await solicitarAcessoGestor({ motivo: reason });
      setReason('');
      await loadRequest();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  function renderRequestForm(title, description) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.helper}>{description}</Text>
        <Text style={styles.label}>Motivo da solicitação *</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Explique sua função e por que precisa de acesso de gestor"
          placeholderTextColor={colors.disabled}
          multiline
          maxLength={500}
          textAlignVertical="top"
          style={styles.input}
          editable={!saving}
        />
        <Text style={styles.counter}>{reason.length}/500 caracteres</Text>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.submitText}>Enviar solicitação</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <AppScreen title="Acesso de gestor" subtitle="Acompanhe sua solicitação de acesso administrativo.">
      {loading ? (
        <View style={styles.state}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helper}>Consultando sua solicitação...</Text>
        </View>
      ) : request ? (
        <>
          <View style={styles.card}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.status, request.status === 'APROVADA' ? styles.approved : request.status === 'REJEITADA' ? styles.rejected : styles.pending]}>
              {STATUS_LABELS[request.status] || request.status}
            </Text>
            <Text style={styles.label}>Motivo enviado</Text>
            <Text style={styles.body}>{request.motivo}</Text>
            {request.observacaoDecisao ? (
              <>
                <Text style={styles.label}>Observação do gestor</Text>
                <Text style={styles.body}>{request.observacaoDecisao}</Text>
              </>
            ) : null}
            {request.status === 'APROVADA' ? (
              <Text style={styles.successNote}>
                Seu perfil foi atualizado para GESTOR. Saia da conta e entre novamente para carregar as permissões administrativas.
              </Text>
            ) : null}
            {request.status === 'REJEITADA' ? (
              <Text style={styles.helper}>
                A solicitação foi rejeitada. Você pode enviar um novo pedido com informações adicionais.
              </Text>
            ) : null}
            <TouchableOpacity style={styles.refreshButton} onPress={loadRequest} disabled={saving}>
              <Text style={styles.refreshText}>Atualizar status</Text>
            </TouchableOpacity>
          </View>
          {request.status === 'REJEITADA'
            ? renderRequestForm('Enviar nova solicitação', 'Explique novamente sua necessidade. O pedido será analisado por um gestor atual.')
            : null}
        </>
      ) : notFound ? (
        renderRequestForm('Solicitar acesso de gestor', 'Você pode enviar um pedido de acesso. Um gestor atual analisará as informações antes de conceder permissões.')
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', padding: 24 },
  helper: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 8 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 17, marginBottom: 12 },
  title: { color: colors.text, fontSize: 16, fontWeight: '800' },
  label: { color: colors.text, fontWeight: '800', fontSize: 11, textTransform: 'uppercase', marginTop: 16, marginBottom: 6 },
  status: { alignSelf: 'flex-start', fontWeight: '900', fontSize: 13, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7 },
  pending: { color: colors.warning, backgroundColor: colors.warningLight },
  approved: { color: colors.success, backgroundColor: colors.successLight },
  rejected: { color: colors.danger, backgroundColor: colors.dangerLight },
  body: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  successNote: { color: colors.success, backgroundColor: colors.successLight, padding: 11, borderRadius: 9, fontSize: 12, lineHeight: 18, marginTop: 15 },
  refreshButton: { alignSelf: 'flex-start', backgroundColor: colors.primaryLight, borderRadius: 9, paddingHorizontal: 13, paddingVertical: 10, marginTop: 18 },
  refreshText: { color: colors.primaryDark, fontWeight: '800', fontSize: 12 },
  input: { minHeight: 110, borderWidth: 1, borderColor: colors.border, borderRadius: 9, padding: 11, color: colors.text, marginTop: 3 },
  counter: { color: colors.textSecondary, textAlign: 'right', fontSize: 10, marginTop: 5 },
  submitButton: { minHeight: 46, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary, borderRadius: 9, marginTop: 13 },
  submitText: { color: colors.textLight, fontWeight: '800', fontSize: 12 },
  error: { color: colors.danger, fontSize: 12, lineHeight: 18, marginTop: 12 },
});
