# Alerta Cidadão — Etapa 4 (Mobile)

## O que foi implementado

- Login real pela API (`POST /api/usuarios/login`).
- Armazenamento do JWT somente em memória por meio de `tokenStorage`.
- Inclusão automática do Bearer token nas chamadas Axios.
- Cadastro público integrado (`POST /api/usuarios`), enviando sempre o perfil `CIDADAO`.
- Validação de nome, e-mail, senha e confirmação de senha antes do envio.
- Exibição dos dados reais do usuário na tela de perfil.
- Logout com remoção do token em memória.
- Telas administrativas disponíveis na navegação somente para usuário com perfil `GESTOR`.
- Listagem de usuários pela API (`GET /api/usuarios?incluirInativos=true`).
- Desativação de usuários pela API (`DELETE /api/usuarios/{id}`), impedindo a desativação da própria conta pela tela.
- Formulário mobile para cadastrar outro gestor e integração preparada para a rota administrativa.

## Dependência pendente na API

No ZIP recebido, `API/src/AlertaCidadao.API/Endpoints/UsuarioEndpoints.cs` não implementa a rota `POST /api/usuarios/gestores`.

A tela de cadastro de gestor chama essa rota e apresenta uma mensagem explicativa quando recebe HTTP 404. Ela **não** tenta usar o cadastro público com `Perfil = GESTOR`, pois o `UsuarioService` da API bloqueia corretamente essa elevação de privilégio.

Para concluir o fluxo de ponta a ponta, a Etapa 4 da API precisa implementar a rota administrativa, protegida pela policy `Gestor`, com body contendo `nome`, `email`, `senha` e `telefone` (opcional). A API deve atribuir `Perfil = GESTOR` no servidor, sem aceitar o perfil enviado pelo cliente.

## Limite entre as etapas

O token permanece apenas em memória. Não foi incluída persistência em SecureStore/AsyncStorage, restauração automática de sessão ou renovação de token, pois isso pertence à Etapa 5.

## Configuração e execução

1. Confira `src/config/apiConfig.js` e ajuste `API_BASE_URL` para o endereço da API acessível pelo aparelho.
2. No diretório `mobile`, execute `npm ci`.
3. Inicie com `npx expo start`.
4. Teste com a API em execução e um usuário existente no Oracle.
