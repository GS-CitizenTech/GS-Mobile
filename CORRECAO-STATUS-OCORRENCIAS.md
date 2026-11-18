# Correção — atualização do status das ocorrências

## O que mudou

Na tela **Detalhes da ocorrência**, usuários com perfil `GESTOR` agora veem uma seção própria para atualizar o status. Ela permite selecionar `ABERTA`, `EM_ANALISE`, `RESOLVIDA` ou `CANCELADA` e salvar a alteração sem precisar abrir o formulário completo de edição.

Ao salvar, o aplicativo envia à API os campos atuais da ocorrência junto com o novo status, atualiza os dados exibidos e informa o resultado. Em caso de falha, apresenta a mensagem retornada pela API e restaura a seleção para o status persistido.

O botão que apenas consulta novamente os dados foi renomeado para **Recarregar dados**, para não ser confundido com a ação de salvar.

## Arquivo alterado

- `mobile/src/screens/OccurrenceScreens.js`

## Testes manuais necessários

1. Entrar no aplicativo com uma conta `GESTOR`.
2. Abrir **Ocorrências** e selecionar uma ocorrência.
3. Na tela de detalhes, selecionar cada um dos quatro status e tocar em **Salvar novo status**.
4. Confirmar que o selo de status e a data de atualização mudam.
5. Sair da tela e abrir novamente a ocorrência para confirmar a persistência.
6. Entrar com uma conta `CIDADAO` e confirmar que a seção de alteração de status não aparece.

Não foi possível executar build Expo ou testes em dispositivo neste ambiente. A alteração deve ser validada no projeto local.
