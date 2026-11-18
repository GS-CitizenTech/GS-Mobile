using AlertaCidadao.Domain.Entities;

namespace AlertaCidadao.Application.Interfaces;

public interface ISolicitacaoGestorRepository
{
    Task<bool> ExistePendenteDoUsuarioAsync(long idUsuario, CancellationToken ct = default);
    Task<IReadOnlyList<SolicitacaoGestor>> ListarAsync(string? status, CancellationToken ct = default);
    Task<SolicitacaoGestor?> ObterPorIdAsync(long id, CancellationToken ct = default);
    Task AdicionarAsync(SolicitacaoGestor solicitacao, CancellationToken ct = default);
    Task SalvarAlteracoesAsync(CancellationToken ct = default);
}
