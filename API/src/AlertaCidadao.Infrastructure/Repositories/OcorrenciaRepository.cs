using AlertaCidadao.Application.Interfaces;
using AlertaCidadao.Domain.Entities;
using AlertaCidadao.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AlertaCidadao.Infrastructure.Repositories;

public sealed class OcorrenciaRepository(AlertaCidadaoDbContext context) : IOcorrenciaRepository
{
    public async Task<IReadOnlyList<Ocorrencia>> ListarAsync(
        long idUsuario,
        bool gestor,
        string? status = null,
        long? idPonto = null,
        CancellationToken cancellationToken = default)
    {
        var query = context.Ocorrencias
            .AsNoTracking()
            .Include(x => x.Usuario)
            .Include(x => x.Ponto)
            .AsQueryable();

        if (!gestor)
            query = query.Where(x => x.IdUsuario == idUsuario);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.Status == status);

        if (idPonto.HasValue)
            query = query.Where(x => x.IdPonto == idPonto.Value);

        return await query
            .OrderByDescending(x => x.DataCriacao)
            .ThenByDescending(x => x.IdOcorrencia)
            .ToListAsync(cancellationToken);
    }

    public Task<Ocorrencia?> ObterPorIdAsync(long id, CancellationToken cancellationToken = default) =>
        context.Ocorrencias
            .Include(x => x.Usuario)
            .Include(x => x.Ponto)
            .FirstOrDefaultAsync(x => x.IdOcorrencia == id, cancellationToken);

    public async Task AdicionarAsync(Ocorrencia ocorrencia, CancellationToken cancellationToken = default)
    {
        await context.Ocorrencias.AddAsync(ocorrencia, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public Task SalvarAlteracoesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);

    public async Task RemoverAsync(Ocorrencia ocorrencia, CancellationToken cancellationToken = default)
    {
        context.Ocorrencias.Remove(ocorrencia);
        await context.SaveChangesAsync(cancellationToken);
    }
}
