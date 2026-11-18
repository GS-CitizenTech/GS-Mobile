import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';

import AppScreen from '../components/AppScreen';
import colors from '../theme/colors';
import { createThemedStyles } from '../theme/themedStyles';
import { useTheme } from '../theme/ThemeContext';
import { listarAlertas, obterAlertaPorId } from '../services/alertaService';
import { listarPontosMonitoramento, obterPontoMonitoramentoPorId } from '../services/pontoMonitoramentoService';
import { listarLeiturasEnchente, obterLeituraEnchentePorId } from '../services/leituraEnchenteService';
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
      <Text style={styles.stateTitle}>Não foi possível carregar os dados</Text>
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
      <Text style={styles.stateTitle}>Nenhum registro encontrado</Text>
      <Text style={styles.stateText}>{message}</Text>
    </View>
  );
}

export function DashboardScreen({ navigation }) {
  useTheme();
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
  useTheme();
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
  useTheme();
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

function formatarEnderecoPonto(point) {
  return [
    point.logradouro,
    point.bairro,
    point.cidade,
    point.uf,
  ].filter(Boolean).join(', ') || 'Endereço não informado';
}

async function abrirLocalizacaoPonto(point) {
  if (point.latitude == null || point.longitude == null) {
    Alert.alert(
      'Localização indisponível',
      'Este ponto ainda não possui latitude e longitude cadastradas.',
    );
    return;
  }

  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    Alert.alert('Coordenadas inválidas', 'Não foi possível abrir a localização deste ponto.');
    return;
  }

  const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Não foi possível abrir o mapa', 'Verifique se há um aplicativo de mapas disponível.');
  }
}

export function PointsScreen({ navigation }) {
  useTheme();
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPoints = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await listarPontosMonitoramento();
      setPoints(data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  return (
    <AppScreen
      title="Monitoramento"
      subtitle="Consulte os pontos ativos de acompanhamento de enchentes."
    >
      <TouchableOpacity style={styles.refreshButton} onPress={loadPoints}>
        <Text style={styles.refreshText}>↻ Atualizar pontos</Text>
      </TouchableOpacity>

      {loading ? (
        <LoadingState message="Carregando pontos de monitoramento..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadPoints} />
      ) : points.length === 0 ? (
        <EmptyState message="Não existem pontos ativos de monitoramento cadastrados." />
      ) : (
        <>
          <Text style={styles.pointsCount}>
            {points.length} {points.length === 1 ? 'ponto ativo encontrado' : 'pontos ativos encontrados'}
          </Text>

          {points.map((point) => (
            <TouchableOpacity
              key={point.idPonto}
              style={styles.pointCard}
              onPress={() => navigation.navigate('PointDetails', { id: point.idPonto })}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Consultar ponto ${point.nome}`}
            >
              <View style={styles.pointHeader}>
                <Text style={styles.pointTitle}>📍 {point.nome}</Text>
                <Text style={styles.pointActiveBadge}>ATIVO</Text>
              </View>
              <Text style={styles.pointCode}>Código: {point.codigo}</Text>
              <Text style={styles.pointLocation}>{formatarEnderecoPonto(point)}</Text>
              {point.descricao ? (
                <Text style={styles.pointDescription} numberOfLines={2}>{point.descricao}</Text>
              ) : null}
              <Text style={styles.detailsLink}>Ver detalhes →</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </AppScreen>
  );
}

export function PointDetailsScreen({ route }) {
  useTheme();
  const pointId = route.params?.id;
  const [point, setPoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPoint = useCallback(async () => {
    if (!pointId) {
      setError('O identificador do ponto não foi informado.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await obterPontoMonitoramentoPorId(pointId);
      setPoint(data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [pointId]);

  useEffect(() => {
    loadPoint();
  }, [loadPoint]);

  if (loading) {
    return (
      <AppScreen title="Detalhes do ponto">
        <LoadingState message="Carregando informações do ponto..." />
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen title="Detalhes do ponto">
        <ErrorState message={error} onRetry={loadPoint} />
      </AppScreen>
    );
  }

  if (!point) {
    return (
      <AppScreen title="Detalhes do ponto">
        <EmptyState message="O ponto solicitado não foi encontrado." />
      </AppScreen>
    );
  }

  const possuiCoordenadas = point.latitude != null && point.longitude != null;

  return (
    <AppScreen
      title={point.nome}
      subtitle="Informações cadastradas para este ponto de monitoramento."
    >
      <View style={styles.detailCard}>
        <Text style={styles.pointActiveBadge}>{point.ativo ? 'ATIVO' : 'INATIVO'}</Text>
        <Text style={styles.detailLabel}>Identificação</Text>
        <Text style={styles.detailText}>ID: {point.idPonto}</Text>
        <Text style={styles.detailText}>Código: {point.codigo}</Text>

        <View style={styles.detailDivider} />
        <Text style={styles.detailLabel}>Descrição</Text>
        <Text style={styles.detailText}>
          {point.descricao || 'Descrição não informada.'}
        </Text>

        <View style={styles.detailDivider} />
        <Text style={styles.detailLabel}>Localização</Text>
        <Text style={styles.detailText}>{formatarEnderecoPonto(point)}</Text>
        <Text style={styles.detailText}>
          Latitude: {point.latitude ?? 'Não informada'}
        </Text>
        <Text style={styles.detailText}>
          Longitude: {point.longitude ?? 'Não informada'}
        </Text>

        <Text style={styles.detailText}>
          Cadastro: {formatarData(point.dataCadastro)}
        </Text>

        {possuiCoordenadas ? (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => abrirLocalizacaoPonto(point)}
          >
            <Text style={styles.mapButtonText}>Abrir localização no mapa</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.notice}>
            Este ponto não possui coordenadas cadastradas. A visualização no mapa ficará disponível quando latitude e longitude forem informadas.
          </Text>
        )}

        <TouchableOpacity style={styles.refreshButton} onPress={loadPoint}>
          <Text style={styles.refreshText}>Atualizar informações</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

function formatarMedida(value, unit) {
  if (value === null || value === undefined || value === '') return `Não informado ${unit}`;
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return `Não informado ${unit}`;
  return `${numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${unit}`;
}

function obterSituacaoLeitura(reading, alertsByReading, alertsAvailable) {
  if (!alertsAvailable) {
    return {
      label: 'Situação indisponível',
      style: styles.situationUnknown,
      explanation: 'Não foi possível consultar os alertas associados.',
    };
  }

  const alert = alertsByReading.get(String(reading.idLeitura));
  if (!alert) {
    return {
      label: 'Sem alerta associado',
      style: styles.situationNeutral,
      explanation: 'Não há alerta cadastrado para esta leitura. Isso não representa uma confirmação de ausência de risco.',
    };
  }

  const status = String(alert.status || '').toUpperCase();
  const classification = String(alert.classificacao || '').toUpperCase();
  if (status === 'ATIVO') {
    return {
      label: `ALERTA ATIVO${classification ? ` • ${classification}` : ''}`,
      style: styles.situationAlert,
      explanation: alert.mensagemExplicativa || 'Existe um alerta ativo associado a esta leitura.',
    };
  }

  if (status === 'RESOLVIDO') {
    return {
      label: `ALERTA RESOLVIDO${classification ? ` • ${classification}` : ''}`,
      style: styles.situationResolved,
      explanation: alert.mensagemExplicativa || 'O alerta associado a esta leitura foi resolvido.',
    };
  }

  return {
    label: 'Situação não classificada',
    style: styles.situationUnknown,
    explanation: 'A API retornou um status de alerta não reconhecido.',
  };
}

function obterSituacaoPonto(pointId, readings, alertsByReading, alertsAvailable) {
  if (!alertsAvailable) {
    return {
      label: 'Situação indisponível',
      style: styles.situationUnknown,
      explanation: 'Não foi possível consultar os alertas associados às leituras deste ponto.',
    };
  }

  const pointAlerts = readings
    .filter((reading) => String(reading.idPonto) === String(pointId))
    .map((reading) => ({
      reading,
      alert: alertsByReading.get(String(reading.idLeitura)),
    }))
    .filter((item) => Boolean(item.alert));

  const activeAlerts = pointAlerts
    .filter((item) => String(item.alert.status || '').toUpperCase() === 'ATIVO')
    .sort((a, b) => new Date(b.alert.dataGeracao).getTime() - new Date(a.alert.dataGeracao).getTime());

  const selected = activeAlerts[0] || pointAlerts
    .sort((a, b) => new Date(b.alert.dataGeracao).getTime() - new Date(a.alert.dataGeracao).getTime())[0];

  if (!selected) {
    return {
      label: 'Sem alerta associado',
      style: styles.situationNeutral,
      explanation: 'Não há alerta associado às leituras retornadas para este ponto. Isso não representa uma confirmação de ausência de risco.',
    };
  }

  const status = String(selected.alert.status || '').toUpperCase();
  const classification = String(selected.alert.classificacao || '').toUpperCase();
  if (status === 'ATIVO') {
    return {
      label: `ALERTA ATIVO${classification ? ` • ${classification}` : ''}`,
      style: styles.situationAlert,
      explanation: `${selected.alert.mensagemExplicativa || 'Existe um alerta ativo.'} Leitura associada: #${selected.reading.idLeitura}.`,
    };
  }

  if (status === 'RESOLVIDO') {
    return {
      label: `ALERTA RESOLVIDO${classification ? ` • ${classification}` : ''}`,
      style: styles.situationResolved,
      explanation: `${selected.alert.mensagemExplicativa || 'O alerta foi resolvido.'} Leitura associada: #${selected.reading.idLeitura}.`,
    };
  }

  return {
    label: 'Situação não classificada',
    style: styles.situationUnknown,
    explanation: 'A API retornou um status de alerta não reconhecido para este ponto.',
  };
}

export function ReadingsScreen({ navigation }) {
  useTheme();
  const [readings, setReadings] = useState([]);
  const [points, setPoints] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [filterPointId, setFilterPointId] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pointsAvailable, setPointsAvailable] = useState(true);
  const [alertsAvailable, setAlertsAvailable] = useState(true);
  const [warnings, setWarnings] = useState([]);

  const loadReadings = useCallback(async () => {
    setLoading(true);
    setError('');
    setWarnings([]);

    const [readingsResult, pointsResult, alertsResult] = await Promise.allSettled([
      listarLeiturasEnchente(),
      listarPontosMonitoramento(),
      listarAlertas(),
    ]);

    if (readingsResult.status === 'fulfilled') {
      const orderedReadings = [...readingsResult.value].sort(
        (a, b) => new Date(b.dataHoraLeitura).getTime() - new Date(a.dataHoraLeitura).getTime(),
      );
      setReadings(orderedReadings);
    } else {
      setReadings([]);
      setError(getApiErrorMessage(readingsResult.reason));
    }

    if (pointsResult.status === 'fulfilled') {
      setPoints(pointsResult.value);
      setPointsAvailable(true);
    } else {
      setPoints([]);
      setPointsAvailable(false);
    }

    if (alertsResult.status === 'fulfilled') {
      setAlerts(alertsResult.value);
      setAlertsAvailable(true);
    } else {
      setAlerts([]);
      setAlertsAvailable(false);
    }

    const nextWarnings = [];
    if (pointsResult.status === 'rejected') {
      nextWarnings.push('Não foi possível carregar os nomes dos pontos. As leituras continuarão identificadas pelo número do ponto.');
    }
    if (alertsResult.status === 'rejected') {
      nextWarnings.push('Não foi possível consultar os alertas associados às leituras.');
    }
    setWarnings(nextWarnings);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadReadings();
  }, [loadReadings]);

  const orderedPoints = [...points].sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'));
  const pointsById = new Map(points.map((point) => [String(point.idPonto), point]));
  const alertsByReading = new Map(alerts.map((alert) => [String(alert.idLeitura), alert]));
  const latestReadingByPoint = new Map();

  readings.forEach((reading) => {
    const key = String(reading.idPonto);
    if (!latestReadingByPoint.has(key)) latestReadingByPoint.set(key, reading);
  });

  const filteredReadings = filterPointId === 'TODOS'
    ? readings
    : readings.filter((reading) => String(reading.idPonto) === filterPointId);

  return (
    <AppScreen
      title="Leituras"
      subtitle="Acompanhe o nível da água, a chuva e o histórico das medições registradas."
    >
      <TouchableOpacity style={styles.refreshButton} onPress={loadReadings}>
        <Text style={styles.refreshText}>↻ Atualizar leituras</Text>
      </TouchableOpacity>

      {warnings.map((warning) => (
        <Text key={warning} style={styles.notice}>{warning}</Text>
      ))}

      {loading ? (
        <LoadingState message="Carregando leituras e situação dos pontos..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadReadings} />
      ) : (
        <>
          <Text style={styles.sectionTitle}>Situação dos pontos monitorados</Text>
          {pointsAvailable && orderedPoints.length > 0 ? (
            orderedPoints.map((point) => {
              const latestReading = latestReadingByPoint.get(String(point.idPonto));
              const situation = obterSituacaoPonto(
                point.idPonto,
                readings,
                alertsByReading,
                alertsAvailable,
              );

              return (
                <TouchableOpacity
                  key={point.idPonto}
                  style={styles.pointSituationCard}
                  onPress={() => navigation.navigate('PointDetails', { id: point.idPonto })}
                  activeOpacity={0.85}
                >
                  <View style={styles.readingCardHeader}>
                    <Text style={styles.readingTitle}>{point.nome}</Text>
                    <Text style={styles.pointCode}>#{point.codigo}</Text>
                  </View>
                  {latestReading ? (
                    <>
                      <Text style={styles.readingMeta}>Última medição: {formatarData(latestReading.dataHoraLeitura)}</Text>
                      <Text style={styles.readingValue}>Nível da água: {formatarMedida(latestReading.nivelAguaCm, 'cm')}</Text>
                      <Text style={styles.readingValue}>Chuva: {formatarMedida(latestReading.chuvaMm, 'mm')}</Text>
                      <Text style={styles.situationLabel}>Situação do ponto, considerando os alertas associados ao histórico</Text>
                      <Text style={[styles.situationBadge, situation.style]}>{situation.label}</Text>
                    </>
                  ) : (
                    <Text style={styles.readingMeta}>Nenhuma leitura registrada para este ponto.</Text>
                  )}
                  {latestReading ? <Text style={styles.readingMeta}>{situation.explanation}</Text> : null}
                  <Text style={styles.detailsLink}>Ver ponto →</Text>
                </TouchableOpacity>
              );
            })
          ) : pointsAvailable ? (
            <EmptyState message="Não existem pontos ativos cadastrados para exibir a situação do monitoramento." />
          ) : (
            <Text style={styles.notice}>A situação por ponto está indisponível porque não foi possível consultar os pontos de monitoramento.</Text>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Histórico de medições</Text>
            <Text style={styles.readingCount}>{filteredReadings.length} registro(s)</Text>
          </View>

          <View style={styles.readingFilters}>
            <TouchableOpacity
              style={[styles.filterButton, styles.readingFilterButton, filterPointId === 'TODOS' && styles.filterButtonActive]}
              onPress={() => setFilterPointId('TODOS')}
            >
              <Text style={[styles.filterButtonText, filterPointId === 'TODOS' && styles.filterButtonTextActive]}>Todos</Text>
            </TouchableOpacity>
            {orderedPoints.map((point) => (
              <TouchableOpacity
                key={point.idPonto}
                style={[styles.filterButton, styles.readingFilterButton, filterPointId === String(point.idPonto) && styles.filterButtonActive]}
                onPress={() => setFilterPointId(String(point.idPonto))}
              >
                <Text
                  style={[styles.filterButtonText, filterPointId === String(point.idPonto) && styles.filterButtonTextActive]}
                  numberOfLines={1}
                >
                  {point.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredReadings.length === 0 ? (
            <EmptyState
              message={readings.length === 0
                ? 'Ainda não existem medições registradas na API.'
                : 'Não existem leituras para o ponto selecionado.'}
            />
          ) : (
            filteredReadings.map((reading) => {
              const point = pointsById.get(String(reading.idPonto));
              const pointName = point?.nome || `Ponto #${reading.idPonto}`;
              const alert = alertsByReading.get(String(reading.idLeitura)) || null;
              const situation = obterSituacaoLeitura(reading, alertsByReading, alertsAvailable);

              return (
                <TouchableOpacity
                  key={reading.idLeitura}
                  style={styles.readingCard}
                  onPress={() => navigation.navigate('ReadingDetails', {
                    id: reading.idLeitura,
                    reading,
                    pointName,
                    alert,
                    alertsAvailable,
                  })}
                  activeOpacity={0.85}
                >
                  <View style={styles.readingCardHeader}>
                    <Text style={styles.readingTitle}>{pointName}</Text>
                    <Text style={styles.readingId}>#{reading.idLeitura}</Text>
                  </View>
                  <Text style={styles.readingMeta}>{formatarData(reading.dataHoraLeitura)}</Text>
                  <Text style={styles.readingValue}>Nível da água: {formatarMedida(reading.nivelAguaCm, 'cm')}</Text>
                  <Text style={styles.readingValue}>Chuva: {formatarMedida(reading.chuvaMm, 'mm')}</Text>
                  <Text style={styles.readingValue}>Elevação: {formatarMedida(reading.elevacaoCmH, 'cm/h')}</Text>
                  <Text style={[styles.situationBadge, situation.style]}>{situation.label}</Text>
                  <Text style={styles.detailsLink}>Ver detalhes da leitura →</Text>
                </TouchableOpacity>
              );
            })
          )}
        </>
      )}
    </AppScreen>
  );
}

export function ReadingDetailsScreen({ route }) {
  useTheme();
  const readingId = route.params?.id ?? route.params?.reading?.idLeitura;
  const initialReading = route.params?.reading || null;
  const [reading, setReading] = useState(initialReading);
  const readingRef = useRef(initialReading);
  const [pointName, setPointName] = useState(route.params?.pointName || '');
  const [alert, setAlert] = useState(route.params?.alert || null);
  const [alertsAvailable, setAlertsAvailable] = useState(route.params?.alertsAvailable ?? false);
  const [loading, setLoading] = useState(!route.params?.reading);
  const [error, setError] = useState('');

  const loadReading = useCallback(async () => {
    if (!readingId) {
      setError('O identificador da leitura não foi informado.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    const [readingResult, pointsResult, alertsResult] = await Promise.allSettled([
      obterLeituraEnchentePorId(readingId),
      listarPontosMonitoramento(),
      listarAlertas(),
    ]);

    if (readingResult.status === 'fulfilled') {
      setReading(readingResult.value);
      readingRef.current = readingResult.value;
    } else if (!readingRef.current) {
      setError(getApiErrorMessage(readingResult.reason));
    } else {
      setError('Não foi possível atualizar a leitura. Os dados exibidos podem estar desatualizados.');
    }

    const currentReading = readingResult.status === 'fulfilled'
      ? readingResult.value
      : readingRef.current;
    if (pointsResult.status === 'fulfilled' && currentReading) {
      const matchedPoint = pointsResult.value.find(
        (point) => String(point.idPonto) === String(currentReading.idPonto),
      );
      if (matchedPoint) setPointName(matchedPoint.nome);
    }

    if (alertsResult.status === 'fulfilled' && currentReading) {
      const matchedAlert = alertsResult.value.find(
        (item) => String(item.idLeitura) === String(currentReading.idLeitura),
      );
      setAlert(matchedAlert || null);
      setAlertsAvailable(true);
    } else {
      setAlertsAvailable(false);
    }

    setLoading(false);
  }, [readingId]);

  useEffect(() => {
    loadReading();
  }, [loadReading]);

  if (loading && !reading) {
    return (
      <AppScreen title="Detalhes da leitura">
        <LoadingState message="Carregando leitura de enchente..." />
      </AppScreen>
    );
  }

  if (error && !reading) {
    return (
      <AppScreen title="Detalhes da leitura">
        <ErrorState message={error} onRetry={loadReading} />
      </AppScreen>
    );
  }

  if (!reading) {
    return (
      <AppScreen title="Detalhes da leitura">
        <EmptyState message="A leitura solicitada não foi encontrada." />
      </AppScreen>
    );
  }

  const situation = obterSituacaoLeitura(
    reading,
    new Map(alert ? [[String(reading.idLeitura), alert]] : []),
    alertsAvailable,
  );

  return (
    <AppScreen
      title="Detalhes da leitura"
      subtitle={pointName || `Ponto #${reading.idPonto}`}
    >
      <View style={styles.detailCard}>
        <Text style={styles.detailLabel}>Identificação</Text>
        <Text style={styles.detailText}>Leitura: #{reading.idLeitura}</Text>
        <Text style={styles.detailText}>Ponto: {pointName || `#${reading.idPonto}`}</Text>

        <View style={styles.detailDivider} />
        <Text style={styles.detailLabel}>Medições registradas</Text>
        <Text style={styles.detailText}>Nível da água: {formatarMedida(reading.nivelAguaCm, 'cm')}</Text>
        <Text style={styles.detailText}>Chuva: {formatarMedida(reading.chuvaMm, 'mm')}</Text>
        <Text style={styles.detailText}>Elevação: {formatarMedida(reading.elevacaoCmH, 'cm/h')}</Text>

        <View style={styles.detailDivider} />
        <Text style={styles.detailLabel}>Data e origem</Text>
        <Text style={styles.detailText}>Data da medição: {formatarData(reading.dataHoraLeitura)}</Text>
        <Text style={styles.detailText}>Recebida em: {formatarData(reading.dataRecebimento)}</Text>
        <Text style={styles.detailText}>Origem: {reading.origem || 'Não informada'}</Text>
        {reading.chaveEvento ? (
          <Text style={styles.detailText}>Chave do evento: {reading.chaveEvento}</Text>
        ) : null}

        <View style={styles.detailDivider} />
        <Text style={styles.detailLabel}>Situação associada</Text>
        <Text style={[styles.situationBadge, situation.style]}>{situation.label}</Text>
        <Text style={styles.detailText}>{situation.explanation}</Text>

        {error ? <Text style={styles.notice}>{error}</Text> : null}
        <TouchableOpacity style={styles.refreshButton} onPress={loadReading}>
          <Text style={styles.refreshText}>Atualizar detalhes</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

export function ProfileScreen({ navigation, onLogout, user }) {
  const { mode, setThemeMode } = useTheme();
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
            onPress={() => navigation.navigate('Gestão')}
          >
            <Text style={styles.secondaryButtonText}>Abrir painel do gestor</Text>
          </TouchableOpacity>
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
      ) : (
        <View style={styles.adminSection}>
          <Text style={styles.adminHeading}>Acesso administrativo</Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('ManagerRequestStatus')}
          >
            <Text style={styles.secondaryButtonText}>Consultar / solicitar acesso de gestor</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.appearanceSection}>
        <Text style={styles.adminHeading}>Aparência</Text>
        <Text style={styles.appearanceDescription}>
          Escolha o tema que prefere utilizar no aplicativo.
        </Text>
        <View style={styles.themeSelector}>
          <TouchableOpacity
            accessibilityRole="radio"
            accessibilityState={{ selected: mode === 'light' }}
            style={[styles.themeOption, mode === 'light' && styles.themeOptionSelected]}
            onPress={() => setThemeMode('light')}
            activeOpacity={0.8}
          >
            <Text style={styles.themeOptionIcon}>☀️</Text>
            <Text style={[styles.themeOptionText, mode === 'light' && styles.themeOptionTextSelected]}>Claro</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="radio"
            accessibilityState={{ selected: mode === 'dark' }}
            style={[styles.themeOption, mode === 'dark' && styles.themeOptionSelected]}
            onPress={() => setThemeMode('dark')}
            activeOpacity={0.8}
          >
            <Text style={styles.themeOptionIcon}>🌙</Text>
            <Text style={[styles.themeOptionText, mode === 'dark' && styles.themeOptionTextSelected]}>Escuro</Text>
          </TouchableOpacity>
        </View>
      </View>

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
  useTheme();
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

const styles = createThemedStyles(() => ({
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
  pointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pointTitle: { fontSize: 17, fontWeight: 'bold', color: colors.text, flex: 1 },
  pointCode: { color: colors.primary, fontSize: 12, fontWeight: 'bold', marginTop: 9 },
  pointLocation: { color: colors.textSecondary, marginTop: 8, lineHeight: 20 },
  pointDescription: { color: colors.textSecondary, marginTop: 8, lineHeight: 19 },
  pointActiveBadge: {
    alignSelf: 'flex-start',
    color: colors.success,
    backgroundColor: colors.successLight,
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    overflow: 'hidden',
  },
  pointsCount: { color: colors.textSecondary, fontSize: 13, marginBottom: 12 },
  mapButton: {
    backgroundColor: colors.primary,
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 16,
  },
  mapButtonText: { color: colors.textLight, fontWeight: 'bold' },
  readingCard: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 13,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pointSituationCard: {
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 13,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  readingTitle: { fontWeight: 'bold', color: colors.text, fontSize: 16, flex: 1 },
  readingId: { color: colors.textSecondary, fontSize: 12 },
  readingMeta: { color: colors.textSecondary, fontSize: 12, marginBottom: 10 },
  readingValue: { color: colors.textSecondary, marginBottom: 7 },
  readingCount: { color: colors.textSecondary, fontSize: 12, alignSelf: 'center' },
  readingFilters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  readingFilterButton: { flex: 0, minWidth: 86, maxWidth: '48%' },
  situationLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 7, marginBottom: 6 },
  situationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 5,
  },
  situationAlert: { color: colors.danger, backgroundColor: colors.dangerLight },
  situationResolved: { color: colors.success, backgroundColor: colors.successLight },
  situationNeutral: { color: colors.textSecondary, backgroundColor: colors.background },
  situationUnknown: { color: colors.warning, backgroundColor: colors.warningLight },
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
  appearanceSection: { marginTop: 24, marginBottom: 8 },
  appearanceDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 12 },
  themeSelector: { flexDirection: 'row', gap: 10 },
  themeOption: { flex: 1, minHeight: 74, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 10 },
  themeOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  themeOptionIcon: { fontSize: 21, marginBottom: 5 },
  themeOptionText: { color: colors.textSecondary, fontWeight: '700', fontSize: 12 },
  themeOptionTextSelected: { color: colors.primaryDark },
  logoutButton: {
    backgroundColor: colors.dangerLight,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
  logoutText: { color: colors.danger, fontWeight: 'bold' },
  aboutName: { fontSize: 22, color: colors.primary, fontWeight: 'bold', marginBottom: 20 },
}));
