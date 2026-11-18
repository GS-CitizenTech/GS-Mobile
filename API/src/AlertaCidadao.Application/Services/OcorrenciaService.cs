using AlertaCidadao.Application.DTOs;
using AlertaCidadao.Application.Interfaces;
using AlertaCidadao.Domain.Entities;

namespace AlertaCidadao.Application.Services;

public sealed class OcorrenciaService(
    IOcorrenciaRepository repository,
    IUsuarioRepository usuarioRepository,
    IPontoMonitoramentoRepository pontoRepository) : IOcorrenciaService
{
    private static readonly HashSet<string> TiposPermitidos = new(StringComparer.Ordinal)
    {
        "ALAGAMENTO", "ENXURRADA", "DESLIZAMENTO", "BUEIRO_ENTUPIDO",
        "RISCO_ESTRUTURAL", "OUTRO"
    };

    private static readonly HashSet<string> StatusPermitidos = new(StringComparer.Ordinal)
    {
        "ABERTA", "EM_ANALISE", "RESOLVIDA", "CANCELADA"
    };

    public async Task<IReadOnlyList<OcorrenciaDto>> ListarAsync(
        long idUsuario, bool gestor, string? status = null, long? idPonto = null,
        CancellationToken cancellationToken = default)
    {
        var itens = await repository.ListarAsync(
            idUsuario, gestor, NormalizarTexto(status)?.ToUpperInvariant(), idPonto, cancellationToken);
        return itens.Select(Mapear).ToList();
    }

    public async Task<ResultadoOperacao<OcorrenciaDto>> ObterPorIdAsync(
        long id, long idUsuario, bool gestor, CancellationToken cancellationToken = default)
    {
        if (id <= 0)
            return ResultadoOperacao<OcorrenciaDto>.FalhouValidacao("id", "O ID deve ser maior que zero.");

        var ocorrencia = await repository.ObterPorIdAsync(id, cancellationToken);
        if (ocorrencia is null || (!gestor && ocorrencia.IdUsuario != idUsuario))
            return ResultadoOperacao<OcorrenciaDto>.Falhou(TipoErroOperacao.NaoEncontrado, "Ocorrência não encontrada.");

        return ResultadoOperacao<OcorrenciaDto>.Ok(Mapear(ocorrencia));
    }

    public async Task<ResultadoOperacao<OcorrenciaDto>> CriarAsync(
        CriarOcorrenciaRequest request, long idUsuario, CancellationToken cancellationToken = default)
    {
        if (idUsuario <= 0)
            return ResultadoOperacao<OcorrenciaDto>.FalhouValidacao("idUsuario", "Usuário autenticado inválido.");

        var usuario = await usuarioRepository.ObterPorIdAsync(idUsuario, cancellationToken);
        if (usuario is null || !usuario.Ativo)
            return ResultadoOperacao<OcorrenciaDto>.Falhou(TipoErroOperacao.NaoEncontrado, "Usuário não encontrado ou inativo.");

        var erro = await ValidarCamposAsync(request, cancellationToken);
        if (erro is not null)
            return ResultadoOperacao<OcorrenciaDto>.FalhouValidacao(erro.Value.Campo, erro.Value.Mensagem);

        var ponto = request.IdPonto.HasValue
            ? await pontoRepository.ObterPorIdAsync(request.IdPonto.Value, cancellationToken)
            : null;

        var ocorrencia = new Ocorrencia
        {
            IdUsuario = idUsuario,
            Usuario = usuario,
            IdPonto = ponto?.IdPonto,
            Ponto = ponto,
            Tipo = request.Tipo.Trim().ToUpperInvariant(),
            Titulo = request.Titulo.Trim(),
            Descricao = request.Descricao.Trim(),
            Logradouro = NormalizarTexto(request.Logradouro),
            Bairro = NormalizarTexto(request.Bairro),
            Cidade = NormalizarTexto(request.Cidade),
            Uf = NormalizarUf(request.Uf),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Status = "ABERTA",
            DataCriacao = DateTimeOffset.UtcNow
        };

        await repository.AdicionarAsync(ocorrencia, cancellationToken);
        return ResultadoOperacao<OcorrenciaDto>.Ok(Mapear(ocorrencia));
    }

    public async Task<ResultadoOperacao<OcorrenciaDto>> AtualizarAsync(
        long id, AtualizarOcorrenciaRequest request, long idUsuario, bool gestor,
        CancellationToken cancellationToken = default)
    {
        if (id <= 0)
            return ResultadoOperacao<OcorrenciaDto>.FalhouValidacao("id", "O ID deve ser maior que zero.");

        var ocorrencia = await repository.ObterPorIdAsync(id, cancellationToken);
        if (ocorrencia is null || (!gestor && ocorrencia.IdUsuario != idUsuario))
            return ResultadoOperacao<OcorrenciaDto>.Falhou(TipoErroOperacao.NaoEncontrado, "Ocorrência não encontrada.");

        if (!gestor && ocorrencia.Status != "ABERTA")
            return ResultadoOperacao<OcorrenciaDto>.Falhou(TipoErroOperacao.Conflito, "Somente ocorrências abertas podem ser editadas pelo cidadão.");

        var erro = await ValidarCamposAsync(request, cancellationToken);
        if (erro is not null)
            return ResultadoOperacao<OcorrenciaDto>.FalhouValidacao(erro.Value.Campo, erro.Value.Mensagem);

        if (gestor && !string.IsNullOrWhiteSpace(request.Status))
        {
            var status = request.Status.Trim().ToUpperInvariant();
            if (!StatusPermitidos.Contains(status))
                return ResultadoOperacao<OcorrenciaDto>.FalhouValidacao("Status", "O status deve ser ABERTA, EM_ANALISE, RESOLVIDA ou CANCELADA.");
            ocorrencia.Status = status;
        }

        var ponto = request.IdPonto.HasValue
            ? await pontoRepository.ObterPorIdAsync(request.IdPonto.Value, cancellationToken)
            : null;

        ocorrencia.IdPonto = ponto?.IdPonto;
        ocorrencia.Ponto = ponto;
        ocorrencia.Tipo = request.Tipo.Trim().ToUpperInvariant();
        ocorrencia.Titulo = request.Titulo.Trim();
        ocorrencia.Descricao = request.Descricao.Trim();
        ocorrencia.Logradouro = NormalizarTexto(request.Logradouro);
        ocorrencia.Bairro = NormalizarTexto(request.Bairro);
        ocorrencia.Cidade = NormalizarTexto(request.Cidade);
        ocorrencia.Uf = NormalizarUf(request.Uf);
        ocorrencia.Latitude = request.Latitude;
        ocorrencia.Longitude = request.Longitude;
        ocorrencia.DataAtualizacao = DateTimeOffset.UtcNow;

        await repository.SalvarAlteracoesAsync(cancellationToken);
        return ResultadoOperacao<OcorrenciaDto>.Ok(Mapear(ocorrencia));
    }

    public async Task<ResultadoOperacao<bool>> ExcluirAsync(
        long id, long idUsuario, bool gestor, CancellationToken cancellationToken = default)
    {
        if (id <= 0)
            return ResultadoOperacao<bool>.FalhouValidacao("id", "O ID deve ser maior que zero.");

        var ocorrencia = await repository.ObterPorIdAsync(id, cancellationToken);
        if (ocorrencia is null || (!gestor && ocorrencia.IdUsuario != idUsuario))
            return ResultadoOperacao<bool>.Falhou(TipoErroOperacao.NaoEncontrado, "Ocorrência não encontrada.");

        if (!gestor && ocorrencia.Status != "ABERTA")
            return ResultadoOperacao<bool>.Falhou(TipoErroOperacao.Conflito, "Somente ocorrências abertas podem ser excluídas pelo cidadão.");

        await repository.RemoverAsync(ocorrencia, cancellationToken);
        return ResultadoOperacao<bool>.Ok(true);
    }

    private async Task<(string Campo, string Mensagem)?> ValidarCamposAsync(
        OcorrenciaRequestBase request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Titulo) || request.Titulo.Trim().Length is < 5 or > 120)
            return ("Titulo", "O título deve ter entre 5 e 120 caracteres.");

        if (string.IsNullOrWhiteSpace(request.Descricao) || request.Descricao.Trim().Length is < 10 or > 1000)
            return ("Descricao", "A descrição deve ter entre 10 e 1000 caracteres.");

        if (string.IsNullOrWhiteSpace(request.Tipo))
            return ("Tipo", "Informe o tipo da ocorrência.");

        var tipo = request.Tipo.Trim().ToUpperInvariant();
        if (!TiposPermitidos.Contains(tipo))
            return ("Tipo", "Tipo inválido. Use ALAGAMENTO, ENXURRADA, DESLIZAMENTO, BUEIRO_ENTUPIDO, RISCO_ESTRUTURAL ou OUTRO.");

        if (request.Latitude.HasValue != request.Longitude.HasValue)
            return ("Latitude", "Informe latitude e longitude juntas.");

        if (request.Latitude is < -90 or > 90)
            return ("Latitude", "A latitude deve estar entre -90 e 90.");

        if (request.Longitude is < -180 or > 180)
            return ("Longitude", "A longitude deve estar entre -180 e 180.");

        if (request.IdPonto.HasValue)
        {
            var ponto = await pontoRepository.ObterPorIdAsync(request.IdPonto.Value, cancellationToken);
            if (ponto is null || !ponto.Ativo)
                return ("IdPonto", "O ponto informado não existe ou está desativado.");
        }
        else if (string.IsNullOrWhiteSpace(request.Logradouro) &&
                 string.IsNullOrWhiteSpace(request.Bairro) &&
                 string.IsNullOrWhiteSpace(request.Cidade))
        {
            return ("IdPonto", "Selecione um ponto de monitoramento ou informe ao menos um endereço.");
        }

        if (!string.IsNullOrWhiteSpace(request.Uf) && request.Uf.Trim().Length != 2)
            return ("Uf", "A UF deve conter exatamente 2 caracteres.");

        return null;
    }

    private static string? NormalizarTexto(string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

    private static string? NormalizarUf(string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? null : valor.Trim().ToUpperInvariant();

    private static OcorrenciaDto Mapear(Ocorrencia x) => new(
        x.IdOcorrencia,
        x.IdUsuario,
        x.Usuario?.Nome ?? "Conta excluída",
        x.IdPonto,
        x.Ponto?.Nome,
        x.Tipo,
        x.Titulo,
        x.Descricao,
        x.Logradouro,
        x.Bairro,
        x.Cidade,
        x.Uf,
        x.Latitude,
        x.Longitude,
        x.Status,
        x.DataCriacao,
        x.DataAtualizacao);
}
