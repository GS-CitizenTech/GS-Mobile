using AlertaCidadao.Application.DTOs;
using AlertaCidadao.Application.Interfaces;
using AlertaCidadao.Domain.Entities;

namespace AlertaCidadao.Application.Services;

public sealed class SolicitacaoGestorService(
    ISolicitacaoGestorRepository repository,
    IUsuarioRepository usuarios) : ISolicitacaoGestorService
{
    public async Task<ResultadoOperacao<SolicitacaoGestorDto>> CriarAsync(
        long idUsuario,
        CriarSolicitacaoGestorRequest request,
        CancellationToken ct = default)
    {
        if (idUsuario <= 0)
            return ResultadoOperacao<SolicitacaoGestorDto>.FalhouValidacao("idUsuario", "Usuário inválido.");

        var usuario = await usuarios.ObterPorIdAsync(idUsuario, ct);
        if (usuario is null || !usuario.Ativo)
            return ResultadoOperacao<SolicitacaoGestorDto>.Falhou(TipoErroOperacao.NaoEncontrado, "Usuário não encontrado ou inativo.");

        if (string.Equals(usuario.Perfil, "GESTOR", StringComparison.OrdinalIgnoreCase))
            return ResultadoOperacao<SolicitacaoGestorDto>.Falhou(TipoErroOperacao.Conflito, "Esta conta já possui perfil de gestor.");

        if (await repository.ExistePendenteDoUsuarioAsync(idUsuario, ct))
            return ResultadoOperacao<SolicitacaoGestorDto>.Falhou(TipoErroOperacao.Conflito, "Você já possui uma solicitação de gestor pendente.");

        var solicitacao = new SolicitacaoGestor
        {
            IdUsuario = idUsuario,
            Motivo = request.Motivo.Trim(),
            Status = "PENDENTE",
            DataSolicitacao = DateTimeOffset.UtcNow
        };

        await repository.AdicionarAsync(solicitacao, ct);
        return ResultadoOperacao<SolicitacaoGestorDto>.Ok(Mapear(solicitacao, usuario));
    }

    public async Task<ResultadoOperacao<SolicitacaoGestorDto>> ObterMinhaAsync(
        long idUsuario, CancellationToken ct = default)
    {
        var solicitacoes = await repository.ListarAsync(null, ct);
        var solicitacao = solicitacoes
            .Where(x => x.IdUsuario == idUsuario)
            .OrderByDescending(x => x.DataSolicitacao)
            .FirstOrDefault();

        if (solicitacao is null)
            return ResultadoOperacao<SolicitacaoGestorDto>.Falhou(TipoErroOperacao.NaoEncontrado, "Nenhuma solicitação foi encontrada para esta conta.");

        var usuario = await usuarios.ObterPorIdAsync(solicitacao.IdUsuario, ct);
        if (usuario is null)
            return ResultadoOperacao<SolicitacaoGestorDto>.Falhou(TipoErroOperacao.NaoEncontrado, "Usuário da solicitação não encontrado.");

        return ResultadoOperacao<SolicitacaoGestorDto>.Ok(Mapear(solicitacao, usuario));
    }

    public async Task<IReadOnlyList<SolicitacaoGestorDto>> ListarAsync(
        string? status, CancellationToken ct = default)
    {
        var solicitacoes = await repository.ListarAsync(status, ct);
        var idsUsuarios = solicitacoes.Select(x => x.IdUsuario).Distinct().ToArray();
        var usuariosLista = await usuarios.ListarAsync(incluirInativos: true, ct: ct);
        var usuariosPorId = usuariosLista.Where(x => idsUsuarios.Contains(x.IdUsuario))
            .ToDictionary(x => x.IdUsuario);

        return solicitacoes
            .Where(x => usuariosPorId.ContainsKey(x.IdUsuario))
            .Select(x => Mapear(x, usuariosPorId[x.IdUsuario]))
            .ToList();
    }

    public async Task<ResultadoOperacao<SolicitacaoGestorDto>> DecidirAsync(
        long id, long idGestor, DecidirSolicitacaoGestorRequest request,
        CancellationToken ct = default)
    {
        if (id <= 0 || idGestor <= 0)
            return ResultadoOperacao<SolicitacaoGestorDto>.FalhouValidacao("id", "Identificador inválido.");

        var solicitacao = await repository.ObterPorIdAsync(id, ct);
        if (solicitacao is null)
            return ResultadoOperacao<SolicitacaoGestorDto>.Falhou(TipoErroOperacao.NaoEncontrado, "Solicitação não encontrada.");

        if (!string.Equals(solicitacao.Status, "PENDENTE", StringComparison.OrdinalIgnoreCase))
            return ResultadoOperacao<SolicitacaoGestorDto>.Falhou(TipoErroOperacao.Conflito, "Esta solicitação já foi analisada.");

        var usuario = await usuarios.ObterPorIdAsync(solicitacao.IdUsuario, ct);
        if (usuario is null || !usuario.Ativo)
            return ResultadoOperacao<SolicitacaoGestorDto>.Falhou(TipoErroOperacao.NaoEncontrado, "O usuário solicitante não está disponível.");

        var status = request.Status.Trim().ToUpperInvariant();
        solicitacao.Status = status;
        solicitacao.DataDecisao = DateTimeOffset.UtcNow;
        solicitacao.IdGestorResponsavel = idGestor;
        solicitacao.ObservacaoDecisao = string.IsNullOrWhiteSpace(request.Observacao)
            ? null : request.Observacao.Trim();

        if (status == "APROVADA")
            usuario.Perfil = "GESTOR";

        await repository.SalvarAlteracoesAsync(ct);
        await usuarios.SalvarAlteracoesAsync(ct);

        return ResultadoOperacao<SolicitacaoGestorDto>.Ok(Mapear(solicitacao, usuario));
    }

    private static SolicitacaoGestorDto Mapear(SolicitacaoGestor x, Usuario usuario) => new(
        x.IdSolicitacaoGestor, x.IdUsuario, usuario.Nome, usuario.Email,
        usuario.Telefone, x.Motivo, x.Status, x.DataSolicitacao,
        x.DataDecisao, x.IdGestorResponsavel, x.ObservacaoDecisao);
}
