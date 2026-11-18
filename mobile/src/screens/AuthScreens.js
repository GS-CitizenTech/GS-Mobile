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
import { login, logout, registerCitizen } from '../services/authService';
import { solicitarAcessoGestor } from '../services/usuarioService';
import { getApiErrorMessage } from '../services/apiError';

function FormError({ message }) {
  if (!message) return null;

  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function LoginScreen({ navigation, onAuthenticated }) {
  useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Informe seu e-mail e sua senha.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErrorMessage('Informe um endereço de e-mail válido.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('A senha deve possuir pelo menos 8 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const session = await login({ email, senha: password });
      onAuthenticated(session.user);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen
      title="Alerta Cidadão"
      subtitle="Monitoramento e prevenção de enchentes. Informação para proteger vidas."
    >
      <View style={styles.brand}>
        <Text style={styles.brandIcon}>🌊</Text>
        <Text style={styles.brandTitle}>ALERTA CIDADÃO</Text>
        <Text style={styles.brandSubtitle}>
          Sua segurança começa com informação.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Entrar na sua conta</Text>

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu e-mail"
          placeholderTextColor={colors.disabled}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
          returnKeyType="next"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite sua senha"
          placeholderTextColor={colors.disabled}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          value={password}
          onChangeText={setPassword}
          editable={!loading}
          onSubmitEditing={handleLogin}
          returnKeyType="go"
        />

        <FormError message={errorMessage} />

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.textLight} />
          ) : (
            <Text style={styles.primaryButtonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Register')}
          disabled={loading}
        >
          <Text style={styles.linkText}>Não tem uma conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Alerta Cidadão • Informação que salva vidas
      </Text>
    </AppScreen>
  );
}

export function RegisterScreen({ navigation }) {
  useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState('CIDADAO');
  const [managerReason, setManagerReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
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

    if (accountType === 'GESTOR' && managerReason.trim().length < 10) {
      setErrorMessage('Explique em pelo menos 10 caracteres por que precisa do acesso de gestor.');
      return;
    }

    try {
      setLoading(true);
      await registerCitizen({
        nome: name,
        email,
        senha: password,
        telefone: phone,
      });

      if (accountType === 'GESTOR') {
        try {
          await login({ email, senha: password });
          await solicitarAcessoGestor({ motivo: managerReason });
          await logout();
          Alert.alert(
            'Solicitação enviada',
            'Sua conta foi criada e a solicitação de acesso de gestor foi enviada. Um gestor atual precisa aprovar o pedido. Até a aprovação, sua conta funciona como cidadão.',
            [{ text: 'Ir para login', onPress: () => navigation.replace('Login') }],
            { cancelable: false },
          );
        } catch (requestError) {
          try { await logout(); } catch (storageError) { console.warn('Não foi possível limpar a sessão temporária.', storageError); }
          Alert.alert(
            'Conta criada',
            `Sua conta foi criada como cidadão, mas o pedido de gestor não foi enviado: ${getApiErrorMessage(requestError)}. Entre normalmente e acesse Perfil > Consultar / solicitar acesso de gestor para tentar novamente.`,
            [{ text: 'Ir para login', onPress: () => navigation.replace('Login') }],
            { cancelable: false },
          );
        }
      } else {
        Alert.alert(
          'Conta criada',
          'Seu cadastro de cidadão foi realizado. Entre com seu e-mail e sua senha.',
          [{ text: 'Ir para login', onPress: () => navigation.replace('Login') }],
          { cancelable: false },
        );
      }
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen
      title="Criar conta"
      subtitle="Cadastre-se para acompanhar informações e alertas da sua região."
    >
      <View style={styles.card}>
        <Text style={styles.heading}>Seus dados</Text>

        <Text style={styles.label}>Tipo de cadastro</Text>
        <View style={styles.accountTypeRow}>
          <TouchableOpacity
            style={[styles.accountTypeOption, accountType === 'CIDADAO' && styles.accountTypeOptionSelected]}
            onPress={() => { setAccountType('CIDADAO'); setErrorMessage(''); }}
            disabled={loading}
          >
            <Text style={[styles.accountTypeTitle, accountType === 'CIDADAO' && styles.accountTypeTitleSelected]}>Cadastrar como cidadão</Text>
            <Text style={styles.accountTypeDescription}>Acesso às informações e registro de ocorrências.</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.accountTypeOption, accountType === 'GESTOR' && styles.accountTypeOptionSelected]}
            onPress={() => { setAccountType('GESTOR'); setErrorMessage(''); }}
            disabled={loading}
          >
            <Text style={[styles.accountTypeTitle, accountType === 'GESTOR' && styles.accountTypeTitleSelected]}>Cadastrar como gestor</Text>
            <Text style={styles.accountTypeDescription}>Solicite acesso administrativo, sujeito à aprovação.</Text>
          </TouchableOpacity>
        </View>

        {accountType === 'GESTOR' ? (
          <View style={styles.managerNotice}>
            <Text style={styles.managerNoticeText}>Por segurança, a escolha não concede privilégios automaticamente. Sua conta será criada como cidadão até que um gestor atual aprove a solicitação.</Text>
            <Text style={styles.label}>Por que você precisa de acesso de gestor? *</Text>
            <TextInput
              style={[styles.input, styles.managerReasonInput]}
              placeholder="Descreva sua função e a necessidade de acesso administrativo"
              placeholderTextColor={colors.disabled}
              value={managerReason}
              onChangeText={setManagerReason}
              multiline
              maxLength={500}
              editable={!loading}
              textAlignVertical="top"
            />
          </View>
        ) : null}

        <Text style={styles.label}>Nome completo *</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu nome"
          placeholderTextColor={colors.disabled}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          editable={!loading}
        />

        <Text style={styles.label}>E-mail *</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu e-mail"
          placeholderTextColor={colors.disabled}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

        <Text style={styles.label}>Telefone (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu telefone"
          placeholderTextColor={colors.disabled}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          editable={!loading}
        />

        <Text style={styles.label}>Senha *</Text>
        <TextInput
          style={styles.input}
          placeholder="Crie uma senha (mínimo 8 caracteres)"
          placeholderTextColor={colors.disabled}
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <Text style={styles.label}>Confirmar senha *</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite a senha novamente"
          placeholderTextColor={colors.disabled}
          secureTextEntry
          autoCapitalize="none"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!loading}
        />

        <FormError message={errorMessage} />

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.disabledButton]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.textLight} />
          ) : (
            <Text style={styles.primaryButtonText}>{accountType === 'GESTOR' ? 'Criar conta e solicitar acesso' : 'Criar minha conta'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.linkText}>Voltar para o login</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = createThemedStyles(() => ({
  brand: {
    alignItems: 'center',
    marginBottom: 25,
  },
  brandIcon: {
    fontSize: 54,
    marginBottom: 8,
  },
  brandTitle: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  brandSubtitle: {
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
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
    marginBottom: 20,
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
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
    minHeight: 50,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.textLight,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  linkButton: {
    alignItems: 'center',
    padding: 15,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
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
  footer: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 25,
    fontSize: 12,
  },
  accountTypeRow: {
    gap: 9,
    marginBottom: 18,
  },
  accountTypeOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 11,
    padding: 13,
    backgroundColor: colors.surface,
  },
  accountTypeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  accountTypeTitle: { color: colors.text, fontWeight: '700', fontSize: 13 },
  accountTypeTitleSelected: { color: colors.primaryDark },
  accountTypeDescription: { color: colors.textSecondary, fontSize: 11, marginTop: 5, lineHeight: 16 },
  managerNotice: { backgroundColor: colors.primaryLight, padding: 12, borderRadius: 10, marginBottom: 16 },
  managerNoticeText: { color: colors.primaryDark, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  managerReasonInput: { minHeight: 90, paddingTop: 12, marginBottom: 0 },
}));
