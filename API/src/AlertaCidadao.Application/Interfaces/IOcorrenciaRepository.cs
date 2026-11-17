using AlertaCidadao.Domain.Entities;

namespace AlertaCidadao.Application.Interfaces;

public interface IOcorrenciaRepository
{
    Task<IReadOnlyList<Ocorrencia>> ListarAsync(
        long idUsuario,
        bool gestor,
        string? status = null,
        long? idPonto = null,
        CancellationToken cancellationToken = default);

    Task<Ocorrencia?> ObterPorIdAsync(
        long id,
        CancellationToken cancellationToken = default);

    Task AdicionarAsync(Ocorrencia ocorrencia, CancellationToken cancellationToken = default);

    Task SalvarAlteracoesAsync(CancellationToken cancellationToken = default);

    Task RemoverAsync(Ocorrencia ocorrencia, CancellationToken cancellationToken = default);
}
