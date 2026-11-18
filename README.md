# Alerta Cidadão — CitizenTech

Aplicativo móvel e API para apoiar o monitoramento de enchentes, a divulgação de alertas e o registro e acompanhamento de ocorrências. A solução reúne informações de pontos de monitoramento, leituras de níveis de água e chuva, cidadãos e gestores em uma aplicação integrada.

## Estrutura do repositório

```text
GS-Mobile/
├── API/       # API REST .NET 9, camadas, persistência Oracle e testes xUnit
└── mobile/    # Aplicativo React Native com Expo
```

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Aplicativo | React Native, Expo, React Navigation, Axios e Expo SecureStore |
| API | C#, .NET 9, ASP.NET Core e Entity Framework Core |
| Banco de dados | Oracle Database |
| Segurança | JWT Bearer, controle de acesso por perfil e armazenamento seguro da sessão |
| Testes | xUnit |

## Funcionalidades

### Aplicativo do cidadão

- Cadastro, login, logout e persistência segura da sessão.
- Visualização de alertas e detalhes de cada alerta.
- Consulta de pontos de monitoramento, endereço, coordenadas e abertura da localização em mapas.
- Consulta de leituras de enchentes e histórico por ponto.
- Criação e acompanhamento de ocorrências, com tipos e status definidos pela API.
- Consulta do status de uma solicitação de acesso ao perfil de gestor.
- Escolha entre tema claro e tema escuro.

### Painel do gestor

O acesso administrativo é liberado somente para usuários autenticados com perfil `GESTOR`. O painel reúne:

- **Alertas:** criar, editar, resolver e excluir alertas.
- **Pontos de monitoramento:** cadastrar, editar e desativar pontos.
- **Leituras:** registrar, editar e excluir leituras, respeitando os vínculos existentes.
- **Ocorrências:** consultar relatos e atualizar seus status.
- **Usuários:** consultar contas, desativar, reativar e excluir permanentemente usuários.
- **Solicitações de gestor:** analisar, aprovar ou rejeitar solicitações de acesso.
- **Cadastro de gestores:** permitir que um gestor existente cadastre outro gestor pela área administrativa.

Uma conta pública que solicita acesso de gestor é criada inicialmente como cidadão. O perfil `GESTOR` só é concedido depois da aprovação por um gestor existente. O cadastro público, por si só, não concede privilégios administrativos.

A gestão de contas protege a última conta de gestor ativo e impede que o gestor desative ou exclua a própria conta pela tela administrativa. O login de uma conta inativa é bloqueado.

### Aparência: tema claro e tema escuro

O aplicativo oferece dois modos visuais selecionáveis em **Perfil → Aparência**:

- **Claro:** paleta clara institucional.
- **Escuro:** fundos escuros, superfícies e bordas adaptadas e textos com contraste para ambientes com pouca iluminação.

A seleção é aplicada às telas de autenticação, às áreas do cidadão, ao painel do gestor, à navegação e à barra de status. A preferência é salva localmente com `expo-secure-store` e restaurada quando o aplicativo é aberto novamente. O tema não depende do perfil do usuário e pode ser alterado a qualquer momento.

## Pré-requisitos

- .NET 9 SDK.
- Oracle Database acessível pela máquina que executa a API.
- Node.js e npm compatíveis com a versão do Expo declarada em `mobile/package.json`.
- Expo Go ou um ambiente de emulador/dispositivo configurado para executar o aplicativo.
- Git (opcional, para versionamento).

## Configuração e execução da API

### 1. Configurar os segredos

As credenciais do Oracle e a chave de assinatura JWT não devem ser gravadas no repositório. Configure-as com User Secrets ou por meio de variáveis seguras do ambiente.

No PowerShell, acesse o projeto da API:

```powershell
Set-Location ".\API\src\AlertaCidadao.API"
```

Inicialize o User Secrets apenas se o projeto ainda não tiver um identificador configurado e defina os valores esperados pela aplicação:

```powershell
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:Oracle" "SUA_CONNECTION_STRING"
dotnet user-secrets set "Jwt:Issuer" "PetCare.API"
dotnet user-secrets set "Jwt:Audience" "PetCare.Client"
dotnet user-secrets set "Jwt:SigningKey" "SUA_CHAVE_SECRETA_FORTE"
dotnet user-secrets set "Jwt:ExpirationMinutes" "60"
```

Use os valores de emissor e audiência esperados pela configuração da API. Não compartilhe nem versione a connection string ou a chave JWT.

### 2. Preparar o schema Oracle

Execute os scripts necessários uma única vez no schema utilizado pela API, conforme o estado do banco:

- `API/initial-create.sql`: criação inicial do schema, quando aplicável.
- `API/add-ocorrencia.sql`: criação da tabela de ocorrências em uma base que ainda não possui esse recurso.
- `API/add-solicitacao-gestor.sql`: criação da tabela de solicitações de acesso ao perfil de gestor.

Não execute scripts de criação novamente em um banco já preparado sem antes verificar os objetos existentes. A API e os scripts precisam apontar para o mesmo schema Oracle.

### 3. Restaurar, compilar, testar e executar

```powershell
Set-Location ".\API"
dotnet restore .\AlertaCidadao.sln
dotnet build .\AlertaCidadao.sln
dotnet test .\AlertaCidadao.sln
dotnet run --project .\src\AlertaCidadao.API
```

A porta local padrão documentada é `5075`; confirme a URL efetiva exibida no terminal ou no perfil de execução.

- API: `http://localhost:5075`
- Swagger: `http://localhost:5075/swagger`
- Health checks: `/health`, `/health/live` e `/health/ready`

### 4. Provisionar o primeiro gestor

O fluxo de cadastro público não cria gestores automaticamente. Para iniciar a administração do ambiente, crie o primeiro gestor com a ferramenta `AlertaCidadao.AdminBootstrap`, depois de configurar `ConnectionStrings:Oracle` nos User Secrets compartilhados pela ferramenta:

```powershell
Set-Location ".\API"
dotnet run --project ".\tools\AlertaCidadao.AdminBootstrap\AlertaCidadao.AdminBootstrap.csproj"
```

A ferramenta solicita os dados do primeiro gestor e aplica as regras de senha e de provisionamento. Não inclua a senha utilizada em documentação, scripts versionados ou mensagens públicas.

## Configuração e execução do aplicativo

### 1. Configurar o endereço da API

Edite `mobile/src/config/apiConfig.js` e ajuste `API_BASE_URL` para o endereço em que a API pode ser acessada pelo dispositivo:

```javascript
export const API_BASE_URL = 'http://SEU_IP_DA_REDE:5075';
```

Em um iPhone ou Android físico, use o endereço IP da máquina na rede local. `localhost` aponta para o próprio aparelho e não para o computador onde a API está em execução.

### 2. Instalar dependências e iniciar o Expo

```powershell
Set-Location ".\mobile"
npm install
npx expo install --check
npx expo start --clear
```

Abra o projeto pelo Expo Go ou por um emulador compatível. Para conectar pelo celular, computador e aparelho precisam estar na mesma rede e o firewall deve permitir o acesso à porta da API.

## Como trocar o tema

1. Abra o aplicativo e entre na conta.
2. Acesse a aba **Perfil**.
3. Localize a seção **Aparência**.
4. Selecione **Claro** ou **Escuro**.
5. Navegue pelas telas e feche/reabra o aplicativo para confirmar que a preferência foi mantida.

A mudança é imediata; não é necessário reiniciar o aplicativo para alternar entre os modos.

## Testes e validação

### API

Execute a suíte automatizada a partir da pasta `API`:

```powershell
dotnet test .\AlertaCidadao.sln --configuration Release
```

Para obter saída detalhada:

```powershell
dotnet test .\AlertaCidadao.sln --configuration Release --logger "console;verbosity=normal"
```

Os testes existentes cobrem regras de aplicação, autenticação/autorização e os recursos de segurança e confiabilidade implementados no projeto. A quantidade de testes pode evoluir; utilize o resultado do comando executado no ambiente local como referência atual.

### Aplicativo

Após iniciar o Expo, valide no dispositivo:

- cadastro, login e logout;
- restauração da sessão e bloqueio de acesso de contas inativas;
- consulta de alertas, pontos e leituras;
- criação e acompanhamento de ocorrências;
- solicitação de acesso de gestor e consulta do status;
- operações do painel administrativo conforme o perfil autenticado;
- ativação, desativação e exclusão de contas;
- seleção dos temas claro e escuro em telas comuns e administrativas;
- persistência da preferência de aparência após fechar e abrir o aplicativo.

## Documentação complementar

- Backend, configuração, endpoints e arquitetura: [API/README.md](API/README.md)
- Gestão administrativa de usuários: [API/docs/GestaoDeUsuarios.md](API/docs/GestaoDeUsuarios.md)
- Fluxo de cadastro e aprovação de gestores: [API/docs/GestaoDeGestores.md](API/docs/GestaoDeGestores.md)
- CRUD e regras de ocorrências: [API/docs/Ocorrencias.md](API/docs/Ocorrencias.md)
- Funcionalidades do painel do gestor: [mobile/PAINEL-GESTOR.md](mobile/PAINEL-GESTOR.md)
