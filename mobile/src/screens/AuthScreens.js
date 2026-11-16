import { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import AppScreen from '../components/AppScreen';
import colors from '../theme/colors';

export function LoginScreen({ navigation, onDemoLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Senha</Text>

        <TextInput
          style={styles.input}
          placeholder="Digite sua senha"
          placeholderTextColor={colors.disabled}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            Alert.alert(
              'Demonstração',
              'A autenticação real será implementada na próxima etapa.'
            );
            onDemoLogin();
          }}
        >
          <Text style={styles.primaryButtonText}>
            Entrar em modo de demonstração
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.linkText}>
            Não tem uma conta? Cadastre-se
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        Alerta Cidadão • Informação que salva vidas
      </Text>
    </AppScreen>
  );
}

export function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  return (
    <AppScreen
      title="Criar conta"
      subtitle="Cadastre-se para acompanhar informações e alertas da sua região."
    >
      <View style={styles.card}>
        <Text style={styles.heading}>Seus dados</Text>

        <Text style={styles.label}>Nome completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu nome"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu e-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Telefone (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu telefone"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Crie uma senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            Alert.alert(
              'Cadastro',
              'O cadastro será conectado à API na próxima etapa.'
            )
          }
        >
          <Text style={styles.primaryButtonText}>
            Criar minha conta
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkText}>
            Voltar para o login
          </Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
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
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
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

  footer: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 25,
    fontSize: 12,
  },
});