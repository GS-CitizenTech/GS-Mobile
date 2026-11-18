using AlertaCidadao.Application.DTOs;

namespace AlertaCidadao.Application.Services;

public interface ISolicitacaoGestorService
{
    Task<ResultadoOperacao<SolicitacaoGestorDto>> CriarAsync(long idUsuario, CriarSolicitacaoGestorRequest request, CancellationToken ct = default);
    Task<ResultadoOperacao<SolicitacaoGestorDto>> ObterMinhaAsync(long idUsuario, CancellationToken ct = default);
    Task<IReadOnlyList<SolicitacaoGestorDto>> ListarAsync(string? status, CancellationToken ct = default);
    Task<ResultadoOperacao<SolicitacaoGestorDto>> DecidirAsync(long id, long idGestor, DecidirSolicitacaoGestorRequest request, CancellationToken ct = default);
}
