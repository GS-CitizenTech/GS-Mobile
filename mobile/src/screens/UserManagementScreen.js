import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import AppScreen from '../components/AppScreen';
import colors from '../theme/colors';
import { deactivateUser, listUsers } from '../services/usuarioService';
import { getApiErrorMessage } from '../services/apiError';

function formatDate(value) {
  if (!value) return 'Data não informada';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data não informada';

  return date.toLocaleDateString('pt-BR');
}

export default function UserManagementScreen({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadUsers = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setErrorMessage('');

    try {
      const result = await listUsers({ incluirInativos: true });
      setUsers(result);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers]),
  );

  function handleDeactivate(targetUser) {
    if (String(targetUser.idUsuario) === String(user?.idUsuario)) {
      Alert.alert(
        'Operação não permitida',
        'Você não pode desativar sua própria conta por esta tela.',
      );
      return;
    }

    Alert.alert(
      'Desativar usuário',
      `Deseja realmente desativar a conta de ${targetUser.nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivateUser(targetUser.idUsuario);
              await loadUsers(false);
              Alert.alert('Sucesso', 'Usuário desativado.');
            } catch (error) {
              Alert.alert('Não foi possível desativar', getApiErrorMessage(error));
            }
          },
        },
      ],
    );
  }

  return (
    <AppScreen
      title="Gerenciar usuários"
      subtitle="Consulte as contas cadastradas e desative usuários quando necessário."
    >
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => {
          setRefreshing(true);
          loadUsers(false);
        }}
        disabled={loading || refreshing}
      >
        {refreshing ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.refreshText}>Atualizar lista</Text>
        )}
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.stateText}>Carregando usuários...</Text>
        </View>
      ) : null}

      {!loading && errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={() => loadUsers()}>
            <Text style={styles.tryAgain}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !errorMessage && users.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nenhum usuário encontrado</Text>
          <Text style={styles.stateText}>
            A API não retornou contas para exibição.
          </Text>
        </View>
      ) : null}

      {!loading && !errorMessage ? users.map((item) => {
        const isSelf = String(item.idUsuario) === String(user?.idUsuario);

        return (
          <View key={String(item.idUsuario)} style={styles.userCard}>
            <View style={styles.userHeader}>
              <Text style={styles.userName}>{item.nome}</Text>
              <View style={[
                styles.statusPill,
                item.ativo ? styles.activePill : styles.inactivePill,
              ]}>
                <Text style={[
                  styles.statusText,
                  item.ativo ? styles.activeText : styles.inactiveText,
                ]}>
                  {item.ativo ? 'ATIVO' : 'INATIVO'}
                </Text>
              </View>
            </View>

            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userMeta}>
              Perfil: {item.perfil} • Cadastro: {formatDate(item.dataCadastro)}
            </Text>

            {item.telefone ? (
              <Text style={styles.userMeta}>Telefone: {item.telefone}</Text>
            ) : null}

            {item.ativo && !isSelf ? (
              <TouchableOpacity
                style={styles.deactivateButton}
                onPress={() => handleDeactivate(item)}
              >
                <Text style={styles.deactivateText}>Desativar usuário</Text>
              </TouchableOpacity>
            ) : null}

            {isSelf ? (
              <Text style={styles.selfNote}>Sua conta — ação de desativação bloqueada.</Text>
            ) : null}
          </View>
        );
      }) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  refreshButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 9,
    backgroundColor: colors.primaryLight,
    marginBottom: 15,
  },
  refreshText: {
    color: colors.primaryDark,
    fontWeight: 'bold',
  },
  centerState: {
    alignItems: 'center',
    padding: 28,
  },
  stateText: {
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  errorText: {
    color: colors.danger,
    lineHeight: 20,
  },
  tryAgain: {
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 13,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 13,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  userName: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  activePill: {
    backgroundColor: colors.successLight,
  },
  inactivePill: {
    backgroundColor: colors.dangerLight,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeText: {
    color: colors.success,
  },
  inactiveText: {
    color: colors.danger,
  },
  userEmail: {
    color: colors.textSecondary,
    marginTop: 8,
  },
  userMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
  deactivateButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.dangerLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 13,
  },
  deactivateText: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 12,
  },
  selfNote: {
    color: colors.warning,
    fontSize: 11,
    marginTop: 12,
  },
});
