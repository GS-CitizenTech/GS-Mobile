# Etapa 5 — Persistência e proteção da sessão

## Implementações

- O JWT e os dados mínimos do usuário são armazenados juntos no `expo-secure-store`.
- A sessão é recuperada na inicialização do aplicativo.
- A tela inicial de carregamento impede que a navegação de login apareça antes da leitura do armazenamento seguro.
- Sessões com `expiresAt` inválido ou vencido são removidas.
- O logout remove a sessão persistida antes de voltar à tela de login.
- Respostas HTTP `401` removem a sessão e retornam o usuário à autenticação.
- O token continua sendo anexado automaticamente às requisições protegidas pelo interceptor Axios.
- Nenhuma senha é armazenada no dispositivo.

## Arquivos alterados

- `package.json` e `package-lock.json`: dependência `expo-secure-store` compatível com Expo SDK 58 (`~58.0.3`).
- `app.json`: plugin do SecureStore e configuração de backup Android.
- `src/services/tokenStorage.js`: armazenamento e validação da sessão segura.
- `src/services/authService.js`: persistência após login, recuperação e logout.
- `src/services/sessionEvents.js`: comunicação de sessão expirada/inválida.
- `src/services/api.js`: remoção da sessão ao receber HTTP 401.
- `src/navigation/RootNavigator.js`: recuperação da sessão ao iniciar o app.
- `src/screens/AppScreens.js`: tratamento de falha ao executar logout.

## Testes manuais obrigatórios

1. Faça login com um usuário ativo.
2. Feche completamente o aplicativo (não apenas minimize).
3. Abra novamente: deve entrar diretamente na área autenticada, sem pedir login.
4. Faça logout: deve voltar à tela de login.
5. Feche e abra novamente: deve continuar deslogado.
6. Faça login novamente e aguarde o token expirar ou use um token inválido no ambiente de teste; ao receber HTTP 401, o app deve limpar a sessão e voltar ao login.
7. Faça login, desligue e ligue a conexão de rede e confirme que a sessão permanece armazenada; a indisponibilidade temporária da API não deve apagar a sessão.
8. Confirme que o cadastro, o perfil e as áreas de gestor continuam funcionando.

## Instalação e execução

Na pasta `mobile`, execute:

```powershell
npm install
npx expo install --check
npx expo start --clear
```

O `expo-secure-store` está incluído no Expo Go para SDK 58. Para builds próprios, mantenha o plugin configurado no `app.json`.

## Observação de segurança

O armazenamento seguro protege o token em repouso no dispositivo. O aplicativo não implementa refresh token porque a API atual não fornece endpoint de renovação. Quando o JWT expira, o usuário precisa autenticar-se novamente.
