import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';

import AppScreen from '../components/AppScreen';
import colors from '../theme/colors';
import { createThemedStyles } from '../theme/themedStyles';
import { useTheme } from '../theme/ThemeContext';
import { registerManager } from '../services/usuarioService';
import { getApiErrorMessage } from '../services/apiError';

export default function ManagerRegisterScreen({ navigation }) {
  useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Preencha todos os campos obrigatórios.');
      return;
    }

    if (name.trim().length < 2) {
      setErrorMessage('O nome deve possuir pelo menos 2 caracteres.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErrorMessage('Informe um endereço de e-mail válido.');
      return;
    }

    if (password.length < 8 || password.length > 100) {
      setErrorMessage('A senha deve possuir entre 8 e 100 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas informadas não coincidem.');
      return;
    }

    try {
      setLoading(true);
      await registerManager({
        nome: name,
        email,
        senha: password,
        telefone: phone,
      });

      Alert.alert('Sucesso', 'Gestor cadastrado com sucesso.');
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      navigation.goBack();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen
      title="Cadastrar gestor"
      subtitle="Cadastre um novo usuário com acesso administrativo ao Alerta Cidadão."
    >
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>🛡️</Text>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Área administrativa</Text>
          <Text style={styles.infoDescription}>
            Somente um gestor autenticado pode solicitar a criação de outro gestor.
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

        <Text style={styles.label}>Telefone (opcional)</Text>
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
          placeholder="Crie uma senha (mínimo 8 caracteres)"
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

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textLight} />
          ) : (
            <Text style={styles.primaryButtonText}>Cadastrar gestor</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = createThemedStyles(() => ({
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
    minHeight: 49,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    marginBottom: 17,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: 9,
    padding: 12,
    marginBottom: 13,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
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
}));
