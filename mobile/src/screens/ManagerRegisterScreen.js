import { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';

import AppScreen from '../components/AppScreen';
import colors from '../theme/colors';

export default function ManagerRegisterScreen({ navigation, onSubmit }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      Alert.alert('E-mail inválido', 'Informe um endereço de e-mail válido.');
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        'Senha inválida',
        'A senha deve possuir pelo menos 8 caracteres.',
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Senhas diferentes', 'As senhas informadas não coincidem.');
      return;
    }

    if (!onSubmit) {
      Alert.alert(
        'Tela preparada',
        'O formulário está pronto. A integração com o endpoint administrativo será feita na próxima etapa.',
      );
      return;
    }

    try {
      setLoading(true);

      await onSubmit({
        nome: name.trim(),
        email: email.trim().toLowerCase(),
        telefone: phone.trim() || null,
        senha: password,
      });

      Alert.alert('Sucesso', 'Gestor cadastrado com sucesso.');

      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert(
        'Erro no cadastro',
        error?.message || 'Não foi possível cadastrar o gestor.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen
      title="Cadastrar gestor"
      subtitle="Cadastre um novo usuário com acesso administrativo ao Alerta Cidadão."
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🛡️</Text>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Área administrativa</Text>

            <Text style={styles.infoDescription}>
              O cadastro de gestores é restrito a usuários com autorização
              administrativa.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Dados do gestor</Text>

          <Text style={styles.label}>Nome completo *</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite o nome completo"
            placeholderTextColor={colors.disabled}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!loading}
          />

          <Text style={styles.label}>E-mail *</Text>

          <TextInput
            style={styles.input}
            placeholder="gestor@email.com"
            placeholderTextColor={colors.disabled}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <Text style={styles.label}>Telefone</Text>

          <TextInput
            style={styles.input}
            placeholder="(00) 00000-0000"
            placeholderTextColor={colors.disabled}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!loading}
          />

          <Text style={styles.label}>Senha *</Text>

          <TextInput
            style={styles.input}
            placeholder="Crie uma senha"
            placeholderTextColor={colors.disabled}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <Text style={styles.label}>Confirmar senha *</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite a senha novamente"
            placeholderTextColor={colors.disabled}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.primaryButton,
              loading && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Cadastrando...' : 'Cadastrar gestor'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>
              Voltar
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Alerta Cidadão • Administração do sistema
        </Text>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 13,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  infoIcon: {
    fontSize: 32,
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: colors.primaryDark,
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 5,
  },

  infoDescription: {
    color: colors.primaryDark,
    fontSize: 12,
    lineHeight: 18,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  heading: {
    fontSize: 19,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 22,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 7,
  },

  input: {
    height: 49,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    marginBottom: 17,
    color: colors.text,
    backgroundColor: colors.surface,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 5,
  },

  disabledButton: {
    opacity: 0.6,
  },

  primaryButtonText: {
    color: colors.textLight,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  backButton: {
    alignItems: 'center',
    padding: 15,
  },

  backButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },

  footer: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 22,
    marginBottom: 20,
    fontSize: 12,
  },
});