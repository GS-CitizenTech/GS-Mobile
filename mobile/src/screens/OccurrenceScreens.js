import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import AppScreen from '../components/AppScreen';
import colors from '../theme/colors';
import { getApiErrorMessage } from '../services/apiError';
import {
  atualizarOcorrencia,
  criarOcorrencia,
  excluirOcorrencia,
  listarOcorrencias,
  obterOcorrenciaPorId,
} from '../services/ocorrenciaService';
import { listarPontosMonitoramento } from '../services/pontoMonitoramentoService';

const TIPOS = [
  { value: 'ALAGAMENTO', label: 'Alagamento' },
  { value: 'ENXURRADA', label: 'Enxurrada' },
  { value: 'DESLIZAMENTO', label: 'Deslizamento' },
  { value: 'BUEIRO_ENTUPIDO', label: 'Bueiro entupido' },
  { value: 'RISCO_ESTRUTURAL', label: 'Risco estrutural' },
  { value: 'OUTRO', label: 'Outro' },
];

const STATUS = [
  { value: 'ABERTA', label: 'Aberta' },
  { value: 'EM_ANALISE', label: 'Em análise' },
  { value: 'RESOLVIDA', label: 'Resolvida' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

function formatarData(data) {
  if (!data) return 'Não informada';
  const parsed = new Date(data);
  return Number.isNaN(parsed.getTime()) ? 'Não informada' : parsed.toLocaleString('pt-BR');
}

function nomeTipo(tipo) {
  return TIPOS.find((item) => item.value === tipo)?.label || tipo || 'Não informado';
}

function nomeStatus(status) {
  return STATUS.find((item) => item.value === status)?.label || status || 'Não informado';
}

function statusStyle(status) {
  if (status === 'RESOLVIDA') return styles.statusResolved;
  if (status === 'CANCELADA') return styles.statusCancelled;
  if (status === 'EM_ANALISE') return styles.statusReview;
  return styles.statusOpen;
}

function StateMessage({ title, message, onRetry }) {
  return (
    <View style={styles.stateCard}>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMessage}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity style={styles.secondaryButton} onPress={onRetry}>
          <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function OccurrenceCard({ item, onPress }) {
  const location = item.nomePonto || [item.bairro, item.cidade, item.uf].filter(Boolean).join(' • ');

  return (
    <TouchableOpacity
      style={styles.occurrenceCard}
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ocorrência ${item.idOcorrencia}: ${item.titulo}`}
    >
      <View style={styles.cardTopRow}>
        <Text style={styles.occurrenceType}>{nomeTipo(item.tipo)}</Text>
        <Text style={[styles.statusBadge, statusStyle(item.status)]}>{nomeStatus(item.status)}</Text>
      </View>
      <Text style={styles.occurrenceTitle}>{item.titulo}</Text>
      <Text style={styles.occurrenceDescription} numberOfLines={3}>{item.descricao}</Text>
      {location ? <Text style={styles.occurrenceLocation}>Local: {location}</Text> : null}
      <Text style={styles.occurrenceMeta}>Registrada em {formatarData(item.dataCriacao)}</Text>
      <Text style={styles.detailsLink}>Ver detalhes →</Text>
    </TouchableOpacity>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default', maxLength }) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        keyboardType={keyboardType}
        maxLength={maxLength}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline ? styles.multilineInput : null]}
      />
    </View>
  );
}

function ChoiceChips({ items, value, onChange }) {
  return (
    <View style={styles.chipsContainer}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.value}
          style={[styles.choiceChip, value === item.value ? styles.choiceChipSelected : null]}
          onPress={() => onChange(item.value)}
          activeOpacity={0.8}
        >
          <Text style={[styles.choiceChipText, value === item.value ? styles.choiceChipTextSelected : null]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function OccurrencesScreen({ navigation, user }) {
  const isManager = String(user?.perfil || '').toUpperCase() === 'GESTOR';
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('TODAS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOccurrences = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listarOcorrencias({ status: filter === 'TODAS' ? undefined : filter });
      setItems(data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(useCallback(() => {
    loadOccurrences();
  }, [loadOccurrences]));

  return (
    <AppScreen
      title="Ocorrências"
      subtitle={isManager
        ? 'Acompanhe e gerencie os registros enviados pela população.'
        : 'Registre problemas na sua região e acompanhe o andamento.'}
    >
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('OccurrenceForm')}
      >
        <Text style={styles.primaryButtonText}>+ Registrar ocorrência</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Filtrar ocorrências</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {[
          { value: 'TODAS', label: 'Todas' },
          { value: 'ABERTA', label: 'Abertas' },
          { value: 'EM_ANALISE', label: 'Em análise' },
          { value: 'RESOLVIDA', label: 'Resolvidas' },
          { value: 'CANCELADA', label: 'Canceladas' },
        ].map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[styles.filterChip, filter === item.value ? styles.filterChipSelected : null]}
            onPress={() => setFilter(item.value)}
          >
            <Text style={[styles.filterChipText, filter === item.value ? styles.filterChipTextSelected : null]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.refreshButton} onPress={loadOccurrences}>
        <Text style={styles.refreshButtonText}>Atualizar listagem</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateMessage}>Carregando ocorrências...</Text>
        </View>
      ) : error ? (
        <StateMessage title="Não foi possível carregar" message={error} onRetry={loadOccurrences} />
      ) : items.length === 0 ? (
        <StateMessage
          title="Nenhuma ocorrência encontrada"
          message={filter === 'TODAS'
            ? 'Ainda não existem ocorrências para exibir. Use o botão acima para registrar a primeira.'
            : 'Não existem ocorrências com o status selecionado.'}
        />
      ) : (
        <View style={styles.listContainer}>
          <Text style={styles.resultCount}>{items.length} registro(s)</Text>
          {items.map((item) => (
            <OccurrenceCard
              key={item.idOcorrencia}
              item={item}
              onPress={() => navigation.navigate('OccurrenceDetails', { id: item.idOcorrencia })}
            />
          ))}
        </View>
      )}
    </AppScreen>
  );
}

export function OccurrenceFormScreen({ navigation, route, user }) {
  const occurrence = route.params?.occurrence || null;
  const isEditing = Boolean(occurrence?.idOcorrencia);
  const isManager = String(user?.perfil || '').toUpperCase() === 'GESTOR';
  const [points, setPoints] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tipo, setTipo] = useState(occurrence?.tipo || 'ALAGAMENTO');
  const [titulo, setTitulo] = useState(occurrence?.titulo || '');
  const [descricao, setDescricao] = useState(occurrence?.descricao || '');
  const [idPonto, setIdPonto] = useState(occurrence?.idPonto ? String(occurrence.idPonto) : '');
  const [logradouro, setLogradouro] = useState(occurrence?.logradouro || '');
  const [bairro, setBairro] = useState(occurrence?.bairro || '');
  const [cidade, setCidade] = useState(occurrence?.cidade || '');
  const [uf, setUf] = useState(occurrence?.uf || '');
  const [latitude, setLatitude] = useState(occurrence?.latitude == null ? '' : String(occurrence.latitude));
  const [longitude, setLongitude] = useState(occurrence?.longitude == null ? '' : String(occurrence.longitude));
  const [status, setStatus] = useState(occurrence?.status || 'ABERTA');

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoadingPoints(true);
    listarPontosMonitoramento()
      .then((data) => { if (active) setPoints(data); })
      .catch((requestError) => { if (active) setError(`Não foi possível carregar os pontos: ${getApiErrorMessage(requestError)}`); })
      .finally(() => { if (active) setLoadingPoints(false); });
    return () => { active = false; };
  }, []));

  function selectPoint(value) {
    setIdPonto(value);
    const selected = points.find((point) => String(point.idPonto) === String(value));
    if (selected) {
      setLogradouro(selected.logradouro || '');
      setBairro(selected.bairro || '');
      setCidade(selected.cidade || '');
      setUf(selected.uf || '');
      setLatitude(selected.latitude == null ? '' : String(selected.latitude));
      setLongitude(selected.longitude == null ? '' : String(selected.longitude));
    }
  }

  async function handleSave() {
    setError('');
    if (titulo.trim().length < 5) {
      setError('Informe um título com pelo menos 5 caracteres.');
      return;
    }
    if (descricao.trim().length < 10) {
      setError('Descreva a ocorrência com pelo menos 10 caracteres.');
      return;
    }
    if (!idPonto && !logradouro.trim() && !bairro.trim() && !cidade.trim()) {
      setError('Selecione um ponto de monitoramento ou informe ao menos um endereço.');
      return;
    }
    if ((latitude.trim() && !longitude.trim()) || (!latitude.trim() && longitude.trim())) {
      setError('Informe latitude e longitude juntas.');
      return;
    }
    if ((latitude.trim() && !Number.isFinite(Number(latitude))) || (longitude.trim() && !Number.isFinite(Number(longitude)))) {
      setError('Latitude e longitude devem ser números válidos.');
      return;
    }

    const payload = {
      tipo, titulo, descricao, idPonto, logradouro, bairro, cidade, uf,
      latitude: latitude.trim() || null,
      longitude: longitude.trim() || null,
      ...(isManager && isEditing ? { status } : {}),
    };

    setSaving(true);
    try {
      if (isEditing) {
        await atualizarOcorrencia(occurrence.idOcorrencia, payload);
      } else {
        await criarOcorrencia(payload);
      }
      Alert.alert('Sucesso', isEditing ? 'Ocorrência atualizada.' : 'Ocorrência registrada.');
      navigation.goBack();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppScreen
      title={isEditing ? 'Editar ocorrência' : 'Nova ocorrência'}
      subtitle={isEditing
        ? (isManager ? 'Atualize os dados e, como gestor, o status do registro.' : 'Edite os dados enquanto a ocorrência estiver aberta.')
        : 'Informe o que aconteceu e onde a situação foi observada.'}
    >
      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>Tipo de ocorrência</Text>
        <ChoiceChips items={TIPOS} value={tipo} onChange={setTipo} />

        <Field label="Título *" value={titulo} onChangeText={setTitulo} placeholder="Ex.: Alagamento na avenida" maxLength={120} />
        <Field label="Descrição *" value={descricao} onChangeText={setDescricao} placeholder="Descreva o que aconteceu, a extensão e os riscos observados..." multiline maxLength={1000} />

        <Text style={styles.fieldLabel}>Ponto de monitoramento (opcional)</Text>
        {loadingPoints ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.pointChoices}>
            <TouchableOpacity
              style={[styles.pointChoice, !idPonto ? styles.pointChoiceSelected : null]}
              onPress={() => setIdPonto('')}
            >
              <Text style={[styles.pointChoiceText, !idPonto ? styles.pointChoiceTextSelected : null]}>Sem ponto</Text>
            </TouchableOpacity>
            {points.map((point) => (
              <TouchableOpacity
                key={point.idPonto}
                style={[styles.pointChoice, idPonto === String(point.idPonto) ? styles.pointChoiceSelected : null]}
                onPress={() => selectPoint(String(point.idPonto))}
              >
                <Text style={[styles.pointChoiceText, idPonto === String(point.idPonto) ? styles.pointChoiceTextSelected : null]}>
                  {point.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Localização</Text>
        <Field label="Logradouro" value={logradouro} onChangeText={setLogradouro} placeholder="Rua, avenida ou referência" maxLength={180} />
        <Field label="Bairro" value={bairro} onChangeText={setBairro} placeholder="Bairro" maxLength={100} />
        <View style={styles.twoColumns}>
          <View style={styles.flexField}>
            <Field label="Cidade" value={cidade} onChangeText={setCidade} placeholder="Cidade" maxLength={100} />
          </View>
          <View style={styles.ufField}>
            <Field label="UF" value={uf} onChangeText={(value) => setUf(value.toUpperCase().slice(0, 2))} placeholder="SP" maxLength={2} />
          </View>
        </View>
        <View style={styles.twoColumns}>
          <View style={styles.flexField}>
            <Field label="Latitude (opcional)" value={latitude} onChangeText={setLatitude} placeholder="-23.550520" keyboardType="decimal-pad" />
          </View>
          <View style={styles.flexField}>
            <Field label="Longitude (opcional)" value={longitude} onChangeText={setLongitude} placeholder="-46.633308" keyboardType="decimal-pad" />
          </View>
        </View>

        {isManager && isEditing ? (
          <>
            <Text style={styles.sectionTitle}>Status (gestor)</Text>
            <ChoiceChips items={STATUS} value={status} onChange={setStatus} />
          </>
        ) : null}

        {error ? <Text style={styles.formError}>{error}</Text> : null}
        <TouchableOpacity style={[styles.primaryButton, saving ? styles.disabledButton : null]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.primaryButtonText}>{isEditing ? 'Salvar alterações' : 'Enviar ocorrência'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={saving}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

export function OccurrenceDetailsScreen({ navigation, route, user }) {
  const id = route.params?.id;
  const isManager = String(user?.perfil || '').toUpperCase() === 'GESTOR';
  const [occurrence, setOccurrence] = useState(route.params?.occurrence || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isOwner = Number(user?.idUsuario) === Number(occurrence?.idUsuario);
  const canManage = isManager || (isOwner && occurrence?.status === 'ABERTA');

  const loadOccurrence = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await obterOcorrenciaPorId(id);
      setOccurrence(data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => {
    loadOccurrence();
  }, [loadOccurrence]));

  function confirmDelete() {
    Alert.alert(
      'Excluir ocorrência',
      'Deseja realmente excluir este registro? Esta ação não poderá ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await excluirOcorrencia(id);
              Alert.alert('Sucesso', 'Ocorrência excluída.');
              navigation.goBack();
            } catch (requestError) {
              setError(getApiErrorMessage(requestError));
            }
          },
        },
      ],
    );
  }

  if (loading && !occurrence) {
    return <AppScreen title="Detalhes da ocorrência"><View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.stateMessage}>Carregando ocorrência...</Text></View></AppScreen>;
  }
  if (error && !occurrence) {
    return <AppScreen title="Detalhes da ocorrência"><StateMessage title="Não foi possível carregar" message={error} onRetry={loadOccurrence} /></AppScreen>;
  }
  if (!occurrence) {
    return <AppScreen title="Detalhes da ocorrência"><StateMessage title="Ocorrência não encontrada" message="O registro pode ter sido removido ou você não possui permissão para visualizá-lo." /></AppScreen>;
  }

  const local = occurrence.nomePonto || [occurrence.logradouro, occurrence.bairro, occurrence.cidade, occurrence.uf].filter(Boolean).join(', ') || 'Local não informado';

  return (
    <AppScreen title="Detalhes da ocorrência" subtitle={`Registro #${occurrence.idOcorrencia}`}>
      <View style={styles.detailCard}>
        <View style={styles.cardTopRow}>
          <Text style={styles.occurrenceType}>{nomeTipo(occurrence.tipo)}</Text>
          <Text style={[styles.statusBadge, statusStyle(occurrence.status)]}>{nomeStatus(occurrence.status)}</Text>
        </View>
        <Text style={styles.detailTitle}>{occurrence.titulo}</Text>
        <Text style={styles.detailText}>{occurrence.descricao}</Text>
        <View style={styles.detailDivider} />
        <Text style={styles.detailLabel}>Responsável pelo registro</Text>
        <Text style={styles.detailText}>{occurrence.nomeUsuario || `Usuário #${occurrence.idUsuario}`}</Text>
        <Text style={styles.detailLabel}>Localização</Text>
        <Text style={styles.detailText}>{local}</Text>
        {occurrence.idPonto ? <Text style={styles.detailText}>Ponto associado: #{occurrence.idPonto}</Text> : null}
        {occurrence.latitude != null && occurrence.longitude != null ? (
          <Text style={styles.detailText}>Coordenadas: {occurrence.latitude}, {occurrence.longitude}</Text>
        ) : null}
        <View style={styles.detailDivider} />
        <Text style={styles.detailLabel}>Datas</Text>
        <Text style={styles.detailText}>Criada em: {formatarData(occurrence.dataCriacao)}</Text>
        <Text style={styles.detailText}>Atualizada em: {formatarData(occurrence.dataAtualizacao)}</Text>
        {error ? <Text style={styles.formError}>{error}</Text> : null}
        {canManage ? (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('OccurrenceForm', { occurrence })}
            >
              <Text style={styles.primaryButtonText}>{isManager ? 'Editar / atualizar status' : 'Editar ocorrência'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
              <Text style={styles.deleteButtonText}>Excluir ocorrência</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.noticeText}>Esta ocorrência não pode mais ser editada pelo cidadão. Em caso de dúvida, entre em contato com a gestão.</Text>
        )}
        <TouchableOpacity style={styles.refreshButton} onPress={loadOccurrence}>
          <Text style={styles.refreshButtonText}>Atualizar detalhes</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  primaryButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', marginBottom: 14 },
  primaryButtonText: { color: colors.textLight, fontWeight: '700', fontSize: 15 },
  secondaryButton: { backgroundColor: colors.primaryLight, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 14 },
  secondaryButtonText: { color: colors.primaryDark, fontWeight: '700' },
  refreshButton: { alignItems: 'center', padding: 12, marginBottom: 12 },
  refreshButtonText: { color: colors.primary, fontWeight: '700' },
  cancelButton: { alignItems: 'center', padding: 12 },
  cancelButtonText: { color: colors.textSecondary, fontWeight: '700' },
  deleteButton: { backgroundColor: colors.dangerLight, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 2 },
  deleteButtonText: { color: colors.danger, fontWeight: '700' },
  disabledButton: { opacity: 0.65 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 18, marginBottom: 10 },
  filterRow: { gap: 8, paddingBottom: 8 },
  filterChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 13, backgroundColor: colors.surface },
  filterChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  filterChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  filterChipTextSelected: { color: colors.primaryDark },
  listContainer: { marginTop: 8, gap: 12 },
  resultCount: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  occurrenceCard: { borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  occurrenceType: { color: colors.primary, fontSize: 12, fontWeight: '800', flex: 1 },
  occurrenceTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 10 },
  occurrenceDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 6 },
  occurrenceLocation: { color: colors.text, fontSize: 12, marginTop: 10 },
  occurrenceMeta: { color: colors.textSecondary, fontSize: 11, marginTop: 8 },
  detailsLink: { color: colors.primary, fontWeight: '700', marginTop: 12, fontSize: 12 },
  statusBadge: { overflow: 'hidden', borderRadius: 12, paddingVertical: 5, paddingHorizontal: 9, fontSize: 10, fontWeight: '800' },
  statusOpen: { color: colors.warning, backgroundColor: colors.warningLight },
  statusReview: { color: colors.primaryDark, backgroundColor: colors.primaryLight },
  statusResolved: { color: colors.success, backgroundColor: colors.successLight },
  statusCancelled: { color: colors.danger, backgroundColor: colors.dangerLight },
  stateCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: colors.border, marginTop: 10 },
  stateTitle: { color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  stateMessage: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 8 },
  loadingContainer: { alignItems: 'center', padding: 24 },
  formCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
  fieldContainer: { marginTop: 14 },
  fieldLabel: { color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: 7 },
  input: { minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, color: colors.text, backgroundColor: colors.surface, fontSize: 14 },
  multilineInput: { minHeight: 112, paddingTop: 12 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  choiceChip: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  choiceChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  choiceChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  choiceChipTextSelected: { color: colors.primaryDark },
  pointChoices: { gap: 8, marginTop: 2 },
  pointChoice: { padding: 11, borderRadius: 9, borderWidth: 1, borderColor: colors.border },
  pointChoiceSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  pointChoiceText: { color: colors.textSecondary, fontSize: 13 },
  pointChoiceTextSelected: { color: colors.primaryDark, fontWeight: '700' },
  twoColumns: { flexDirection: 'row', gap: 10 },
  flexField: { flex: 1 },
  ufField: { width: 76 },
  formError: { color: colors.danger, fontSize: 13, lineHeight: 18, marginTop: 14 },
  detailCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: colors.border },
  detailTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 14, marginBottom: 10 },
  detailLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800', marginTop: 16, marginBottom: 6, textTransform: 'uppercase' },
  detailText: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 4 },
  detailDivider: { height: 1, backgroundColor: colors.border, marginTop: 16 },
  noticeText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 16 },
});
