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
  listarTodosPontosMonitoramento,
  criarPontoMonitoramento,
  atualizarPontoMonitoramento,
  desativarPontoMonitoramento,
} from '../services/pontoMonitoramentoService';
import {
  listarLeiturasEnchente,
  criarLeituraEnchente,
  atualizarLeituraEnchente,
  excluirLeituraEnchente,
} from '../services/leituraEnchenteService';
import {
  listarAlertas,
  criarAlerta,
  atualizarAlerta,
  excluirAlerta,
} from '../services/alertaService';

const CONFIG = {
  points: {
    title: 'Gerenciar pontos',
    subtitle: 'Cadastre, edite e desative os pontos de monitoramento.',
    empty: 'Não existem pontos cadastrados.',
    newLabel: 'Novo ponto',
    blank: () => ({ codigo: '', nome: '', descricao: '', logradouro: '', bairro: '', cidade: '', uf: '', latitude: '', longitude: '', ativo: true }),
    load: listarTodosPontosMonitoramento,
    create: criarPontoMonitoramento,
    update: atualizarPontoMonitoramento,
    remove: desativarPontoMonitoramento,
    id: 'idPonto',
    titleOf: (x) => `${x.nome || 'Ponto'} • ${x.codigo || `#${x.idPonto}`}`,
    summary: (x) => `${[x.bairro, x.cidade, x.uf].filter(Boolean).join(' • ') || 'Localização não informada'}${x.ativo ? '' : ' • DESATIVADO'}`,
  },
  readings: {
    title: 'Gerenciar leituras',
    subtitle: 'Registre, corrija e exclua medições de enchente.',
    empty: 'Não existem leituras cadastradas.',
    newLabel: 'Nova leitura',
    blank: () => ({ idPonto: '', nivelAguaCm: '', chuvaMm: '0', elevacaoCmH: '0', dataHoraLeitura: new Date().toISOString(), origem: 'MANUAL', chaveEvento: '' }),
    load: listarLeiturasEnchente,
    create: criarLeituraEnchente,
    update: atualizarLeituraEnchente,
    remove: excluirLeituraEnchente,
    id: 'idLeitura',
    titleOf: (x) => `Leitura #${x.idLeitura}`,
    summary: (x) => `Ponto #${x.idPonto} • Água: ${x.nivelAguaCm} cm • Chuva: ${x.chuvaMm} mm`,
  },
  alerts: {
    title: 'Gerenciar alertas',
    subtitle: 'Crie, edite, resolva e exclua alertas associados às leituras.',
    empty: 'Não existem alertas cadastrados.',
    newLabel: 'Novo alerta',
    blank: () => ({ idLeitura: '', classificacao: 'MODERADO', probabilidade: '0.5', mensagemExplicativa: '', tipoMensagem: '', modeloMl: '', status: 'ATIVO' }),
    load: listarAlertas,
    create: criarAlerta,
    update: atualizarAlerta,
    remove: excluirAlerta,
    id: 'idAlerta',
    titleOf: (x) => `Alerta #${x.idAlerta} • ${x.classificacao}`,
    summary: (x) => `Leitura #${x.idLeitura} • ${x.status}`,
  },
};

function Field({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default', editable = true }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={String(value ?? '')}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={colors.disabled}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline ? styles.multiline : null]}
      />
    </View>
  );
}

function ChoiceRow({ label, value, options, onChange }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choices}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.choice, value === option.value && styles.choiceSelected]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.choiceText, value === option.value && styles.choiceTextSelected]}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function formatDate(value) {
  if (!value) return 'Data não informada';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleString('pt-BR');
}

function ManagerDataScreen({ kind }) {
  const config = CONFIG[kind];
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(config.blank());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await config.load());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [config]);

  useFocusEffect(useCallback(() => {
    loadItems();
  }, [loadItems]));

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startNew() {
    setSelected(null);
    setForm(config.blank());
    setError('');
  }

  function startEdit(item) {
    setSelected(item);
    const next = config.blank();
    Object.keys(next).forEach((key) => {
      if (item[key] !== undefined && item[key] !== null) next[key] = String(item[key]);
    });
    if (kind === 'points') next.ativo = item.ativo !== false;
    setForm(next);
    setError('');
  }

  function validate() {
    if (kind === 'points') {
      if (!form.codigo.trim() || !form.nome.trim()) return 'Informe o código e o nome do ponto.';
      if ((form.latitude.trim() === '') !== (form.longitude.trim() === '')) return 'Informe latitude e longitude juntas.';
      if (form.latitude.trim() !== '' && (!Number.isFinite(Number(form.latitude)) || Number(form.latitude) < -90 || Number(form.latitude) > 90)) return 'Latitude inválida.';
      if (form.longitude.trim() !== '' && (!Number.isFinite(Number(form.longitude)) || Number(form.longitude) < -180 || Number(form.longitude) > 180)) return 'Longitude inválida.';
    }
    if (kind === 'readings') {
      if (!Number.isInteger(Number(form.idPonto)) || Number(form.idPonto) <= 0) return 'Informe um ID de ponto válido.';
      for (const field of ['nivelAguaCm', 'chuvaMm', 'elevacaoCmH']) {
        if (!Number.isFinite(Number(form[field])) || Number(form[field]) < 0) return 'Os valores da leitura devem ser números iguais ou maiores que zero.';
      }
      if (Number.isNaN(new Date(form.dataHoraLeitura).getTime())) return 'Informe uma data e hora válidas em formato ISO.';
    }
    if (kind === 'alerts') {
      if (!selected && (!Number.isInteger(Number(form.idLeitura)) || Number(form.idLeitura) <= 0)) return 'Informe um ID de leitura válido.';
      if (form.probabilidade.trim() !== '' && (!Number.isFinite(Number(form.probabilidade)) || Number(form.probabilidade) < 0 || Number(form.probabilidade) > 1)) return 'A probabilidade deve estar entre 0 e 1.';
    }
    return '';
  }

  async function handleSave() {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (kind === 'points') {
        await (selected
          ? config.update(selected[config.id], payload)
          : config.create(payload));
      } else if (kind === 'readings') {
        await (selected
          ? config.update(selected[config.id], payload)
          : config.create(payload));
      } else {
        await (selected
          ? config.update(selected[config.id], payload)
          : config.create(payload));
      }
      await loadItems();
      startNew();
      Alert.alert('Sucesso', selected ? 'Registro atualizado.' : 'Registro cadastrado.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  function handleRemove(item) {
    const isPoint = kind === 'points';
    Alert.alert(
      isPoint ? 'Desativar ponto' : 'Excluir registro',
      isPoint
        ? `Deseja desativar ${item.nome}? O histórico de leituras será preservado.`
        : `Deseja realmente excluir o registro #${item[config.id]}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: isPoint ? 'Desativar' : 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await config.remove(item[config.id]);
              if (String(selected?.[config.id]) === String(item[config.id])) startNew();
              await loadItems();
              Alert.alert('Sucesso', isPoint ? 'Ponto desativado.' : 'Registro excluído.');
            } catch (requestError) {
              Alert.alert('Não foi possível concluir', getApiErrorMessage(requestError));
            }
          },
        },
      ],
    );
  }

  return (
    <AppScreen title={config.title} subtitle={config.subtitle}>
      <View style={styles.topActions}>
        <TouchableOpacity style={styles.primaryButton} onPress={startNew}>
          <Text style={styles.primaryButtonText}>+ {config.newLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshButton} onPress={loadItems} disabled={loading || saving}>
          <Text style={styles.refreshText}>Atualizar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitle}>{selected ? `Editar #${selected[config.id]}` : config.newLabel}</Text>
        {kind === 'points' ? (
          <>
            <Field label="Código *" value={form.codigo} onChangeText={(v) => updateField('codigo', v)} editable={!saving} />
            <Field label="Nome *" value={form.nome} onChangeText={(v) => updateField('nome', v)} editable={!saving} />
            <Field label="Descrição" value={form.descricao} onChangeText={(v) => updateField('descricao', v)} multiline editable={!saving} />
            <Field label="Logradouro" value={form.logradouro} onChangeText={(v) => updateField('logradouro', v)} editable={!saving} />
            <Field label="Bairro" value={form.bairro} onChangeText={(v) => updateField('bairro', v)} editable={!saving} />
            <Field label="Cidade" value={form.cidade} onChangeText={(v) => updateField('cidade', v)} editable={!saving} />
            <Field label="UF" value={form.uf} onChangeText={(v) => updateField('uf', v)} editable={!saving} />
            <Field label="Latitude" value={form.latitude} onChangeText={(v) => updateField('latitude', v)} keyboardType="decimal-pad" editable={!saving} />
            <Field label="Longitude" value={form.longitude} onChangeText={(v) => updateField('longitude', v)} keyboardType="decimal-pad" editable={!saving} />
            {selected ? <ChoiceRow label="Situação" value={form.ativo ? true : false} onChange={(v) => updateField('ativo', v)} options={[{ value: true, label: 'Ativo' }, { value: false, label: 'Inativo' }]} /> : null}
          </>
        ) : null}

        {kind === 'readings' ? (
          <>
            <Field label="ID do ponto *" value={form.idPonto} onChangeText={(v) => updateField('idPonto', v)} keyboardType="numeric" editable={!saving && !selected} />
            <Field label="Nível da água (cm) *" value={form.nivelAguaCm} onChangeText={(v) => updateField('nivelAguaCm', v)} keyboardType="decimal-pad" editable={!saving} />
            <Field label="Chuva (mm) *" value={form.chuvaMm} onChangeText={(v) => updateField('chuvaMm', v)} keyboardType="decimal-pad" editable={!saving} />
            <Field label="Elevação (cm/h) *" value={form.elevacaoCmH} onChangeText={(v) => updateField('elevacaoCmH', v)} keyboardType="decimal-pad" editable={!saving} />
            <Field label="Data/hora (ISO 8601) *" value={form.dataHoraLeitura} onChangeText={(v) => updateField('dataHoraLeitura', v)} editable={!saving} />
            <ChoiceRow label="Origem" value={form.origem} onChange={(v) => updateField('origem', v)} options={[{ value: 'MANUAL', label: 'Manual' }, { value: 'SENSOR', label: 'Sensor' }, { value: 'SIMULACAO', label: 'Simulação' }]} />
            {!selected ? <Field label="Chave do evento (opcional)" value={form.chaveEvento} onChangeText={(v) => updateField('chaveEvento', v)} editable={!saving} /> : null}
          </>
        ) : null}

        {kind === 'alerts' ? (
          <>
            {!selected ? <Field label="ID da leitura *" value={form.idLeitura} onChangeText={(v) => updateField('idLeitura', v)} keyboardType="numeric" editable={!saving} /> : null}
            <ChoiceRow label="Classificação" value={form.classificacao} onChange={(v) => updateField('classificacao', v)} options={[{ value: 'BAIXO', label: 'Baixo' }, { value: 'MODERADO', label: 'Moderado' }, { value: 'ALTO', label: 'Alto' }, { value: 'CRITICO', label: 'Crítico' }]} />
            <Field label="Probabilidade (0 a 1)" value={form.probabilidade} onChangeText={(v) => updateField('probabilidade', v)} keyboardType="decimal-pad" editable={!saving} />
            <Field label="Mensagem explicativa" value={form.mensagemExplicativa} onChangeText={(v) => updateField('mensagemExplicativa', v)} multiline editable={!saving} />
            <Field label="Tipo da mensagem" value={form.tipoMensagem} onChangeText={(v) => updateField('tipoMensagem', v)} editable={!saving} />
            <Field label="Modelo ML" value={form.modeloMl} onChangeText={(v) => updateField('modeloMl', v)} editable={!saving} />
            {selected ? <ChoiceRow label="Status" value={form.status} onChange={(v) => updateField('status', v)} options={[{ value: 'ATIVO', label: 'Ativo' }, { value: 'RESOLVIDO', label: 'Resolvido' }]} /> : null}
          </>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.formActions}>
          <TouchableOpacity style={[styles.primaryButton, styles.flexButton]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.primaryButtonText}>{selected ? 'Salvar alterações' : 'Cadastrar'}</Text>}
          </TouchableOpacity>
          {selected ? <TouchableOpacity style={styles.cancelButton} onPress={startNew} disabled={saving}><Text style={styles.cancelText}>Cancelar edição</Text></TouchableOpacity> : null}
        </View>
      </View>

      <Text style={styles.listTitle}>Registros cadastrados ({items.length})</Text>
      {loading ? <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.helper}>Carregando registros...</Text></View> : null}
      {!loading && error && items.length === 0 ? <Text style={styles.errorText}>{error}</Text> : null}
      {!loading && items.length === 0 ? <View style={styles.emptyCard}><Text style={styles.helper}>{config.empty}</Text></View> : null}
      {!loading ? items.map((item) => (
        <View key={String(item[config.id])} style={styles.itemCard}>
          <Text style={styles.itemTitle}>{config.titleOf(item)}</Text>
          <Text style={styles.itemSummary}>{config.summary(item)}</Text>
          {kind === 'readings' ? <Text style={styles.itemMeta}>Medição: {formatDate(item.dataHoraLeitura)} • Origem: {item.origem}</Text> : null}
          {kind === 'alerts' ? <Text style={styles.itemMeta}>Gerado em: {formatDate(item.dataGeracao)}</Text> : null}
          <View style={styles.itemActions}>
            {!(kind === 'points' && item.ativo === false) ? (
              <>
                <TouchableOpacity style={styles.editButton} onPress={() => startEdit(item)}><Text style={styles.editText}>Editar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleRemove(item)}><Text style={styles.deleteText}>{kind === 'points' ? 'Desativar' : 'Excluir'}</Text></TouchableOpacity>
              </>
            ) : <Text style={styles.itemMeta}>Este ponto está desativado.</Text>}
          </View>
        </View>
      )) : null}
    </AppScreen>
  );
}

export function ManagerPointsScreen() { return <ManagerDataScreen kind="points" />; }
export function ManagerReadingsScreen() { return <ManagerDataScreen kind="readings" />; }
export function ManagerAlertsScreen() { return <ManagerDataScreen kind="alerts" />; }

const styles = StyleSheet.create({
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
  primaryButton: { backgroundColor: colors.primary, minHeight: 44, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  primaryButtonText: { color: colors.textLight, fontWeight: '800', fontSize: 12 },
  refreshButton: { minHeight: 44, borderRadius: 9, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: colors.primaryLight },
  refreshText: { color: colors.primaryDark, fontWeight: '800', fontSize: 12 },
  formCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16 },
  formTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginBottom: 4 },
  fieldGroup: { marginTop: 12 },
  fieldLabel: { color: colors.text, fontWeight: '700', fontSize: 12, marginBottom: 6 },
  input: { minHeight: 44, borderRadius: 9, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11, color: colors.text, backgroundColor: colors.surface, fontSize: 13 },
  multiline: { minHeight: 82, paddingTop: 10 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 8 },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  choiceText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  choiceTextSelected: { color: colors.primaryDark },
  formActions: { gap: 8, marginTop: 16 },
  flexButton: { width: '100%' },
  cancelButton: { minHeight: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight },
  cancelText: { color: colors.primaryDark, fontWeight: '700', fontSize: 12 },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 18, marginTop: 12 },
  listTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 20, marginBottom: 10 },
  loading: { alignItems: 'center', padding: 22 },
  helper: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 7 },
  emptyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 17 },
  itemCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  itemTitle: { color: colors.text, fontWeight: '800', fontSize: 13 },
  itemSummary: { color: colors.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 17 },
  itemMeta: { color: colors.textSecondary, fontSize: 10, marginTop: 5 },
  itemActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editButton: { backgroundColor: colors.primaryLight, borderRadius: 8, paddingHorizontal: 13, paddingVertical: 9 },
  editText: { color: colors.primaryDark, fontWeight: '800', fontSize: 11 },
  deleteButton: { backgroundColor: colors.dangerLight, borderRadius: 8, paddingHorizontal: 13, paddingVertical: 9 },
  deleteText: { color: colors.danger, fontWeight: '800', fontSize: 11 },
});
