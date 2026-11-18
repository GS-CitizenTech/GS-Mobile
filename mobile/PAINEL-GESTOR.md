# Painel do gestor — Alerta Cidadão

## Funcionalidades

- Cadastro público com seleção entre cidadão e solicitação de acesso como gestor.
- Solicitação de acesso vinculada ao usuário autenticado e aprovação/rejeição por gestor atual.
- Tela de consulta do status do próprio pedido no perfil do usuário.
- Painel administrativo com indicadores de alertas, pontos, leituras e ocorrências.
- Gestão de alertas: criar, editar classificação, probabilidade, mensagem e status, e excluir.
- Gestão de pontos: criar, editar dados/endereço/coordenadas e desativar preservando o histórico.
- Gestão de leituras: criar, editar medições e excluir quando não houver alerta vinculado.
- Ocorrências: usar o fluxo existente para consultar todos os relatos e atualizar status.
- Usuários: consultar e desativar contas.
- Gestores: aprovar solicitações ou cadastrar outro gestor por meio autenticado.

## Segurança

A opção “Cadastrar como gestor” cria inicialmente uma conta de cidadão e envia uma solicitação. O usuário somente recebe o perfil `GESTOR` após aprovação. A API valida JWT e role em todos os endpoints administrativos.

## Executar

Antes de testar, execute `API/add-solicitacao-gestor.sql` no Oracle, atualize a API e reinicie o serviço. No mobile, execute `npm install` e `npx expo start -c`.
