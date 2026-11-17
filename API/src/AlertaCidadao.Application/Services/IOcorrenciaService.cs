using AlertaCidadao.Application.DTOs;

namespace AlertaCidadao.Application.Services;

public interface IOcorrenciaService
{
    Task<IReadOnlyList<OcorrenciaDto>> ListarAsync(
        long idUsuario,
        bool gestor,
        string? status = null,
        long? idPonto = null,
        CancellationToken cancellationToken = default);

    Task<ResultadoOperacao<OcorrenciaDto>> ObterPorIdAsync(
        long id,
        long idUsuario,
        bool gestor,
        CancellationToken cancellationToken = default);

    Task<ResultadoOperacao<OcorrenciaDto>> CriarAsync(
        CriarOcorrenciaRequest request,
        long idUsuario,
        CancellationToken cancellationToken = default);

    Task<ResultadoOperacao<OcorrenciaDto>> AtualizarAsync(
        long id,
        AtualizarOcorrenciaRequest request,
        long idUsuario,
        bool gestor,
        CancellationToken cancellationToken = default);

    Task<ResultadoOperacao<bool>> ExcluirAsync(
        long id,
        long idUsuario,
        bool gestor,
        CancellationToken cancellationToken = default);
}
