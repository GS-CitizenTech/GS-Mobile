# Alerta Cidadão — CitizenTech

Aplicativo móvel e API para apoio ao monitoramento de enchentes, registro de ocorrências e acompanhamento de alertas e pontos de monitoramento.

## Estrutura

```text
GS-Mobile/
├── API/       # API REST .NET 9, camadas e testes xUnit
└── mobile/    # Aplicativo React Native com Expo
```

## Tecnologias

- Mobile: React Native, Expo, React Navigation, Axios e Expo SecureStore.
- Backend: C#, .NET 9, ASP.NET Core e Entity Framework Core.
- Banco de dados: Oracle Database.
- Autenticação: JWT Bearer, com perfis de cidadão e gestor.

## Recursos do aplicativo

- Login, cadastro de cidadão e persistência segura da sessão.
- Perfil e gerenciamento de usuários para gestores.
- Consulta de alertas e detalhes.
- Consulta de pontos de monitoramento e abertura de localização em mapas.
- Consulta de leituras de enchentes e histórico por ponto.
- Registro e acompanhamento de ocorrências, com permissões específicas para cidadãos e gestores.

## Executar a API

Pré-requisitos: .NET 9 SDK e Oracle Database configurado.

1. Configure a connection string `ConnectionStrings:Oracle` e as opções JWT por User Secrets ou configuração segura do ambiente. Não armazene credenciais no repositório.
2. Se estiver utilizando um banco Oracle já existente, aplique os scripts de migração necessários. Para o CRUD de ocorrências da Etapa 9, execute `API/add-ocorrencia.sql` uma única vez no mesmo schema utilizado pela API.
3. No PowerShell, execute:

```powershell
Set-Location ".\API"
dotnet restore .\AlertaCidadao.sln
dotnet build .\AlertaCidadao.sln
dotnet test .\AlertaCidadao.sln
dotnet run --project .\src\AlertaCidadao.API
```

Swagger: `http://localhost:5075/swagger` (confira a porta efetiva no perfil de execução).

## Executar o Mobile

1. Confira `mobile/src/config/apiConfig.js` e configure `API_BASE_URL` com o endereço da API acessível pelo aparelho. Em teste físico, use o IP LAN do computador, não `localhost`.
2. No PowerShell:

```powershell
Set-Location ".\mobile"
npm install
npx expo install --check
npx expo start --clear
```

Abra o projeto pelo Expo Go no aparelho ou emulador compatível.

## Documentação complementar

- Backend e endpoints: [API/README.md](API/README.md)
- CRUD de ocorrências: [API/docs/Ocorrencias.md](API/docs/Ocorrencias.md)
- Testes e execução mobile da Etapa 9: [mobile/ETAPA9.md](mobile/ETAPA9.md)
