using AlertaCidadao.Application.Interfaces;
using AlertaCidadao.Domain.Entities;
using AlertaCidadao.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AlertaCidadao.Infrastructure.Repositories;

public sealed class SolicitacaoGestorRepository(AlertaCidadaoDbContext context)
    : ISolicitacaoGestorRepository
{
    public async Task<bool> ExistePendenteDoUsuarioAsync(long idUsuario, CancellationToken ct = default)
    {
        // Oracle SQL não aceita os literais booleanos TRUE/FALSE em SQL tradicional.
        // COUNT(*) evita que o EF Core gere CASE ... THEN TRUE ELSE FALSE.
        var quantidade = await context.Set<SolicitacaoGestor>()
            .AsNoTracking()
            .Where(x => x.IdUsuario == idUsuario && x.Status == "PENDENTE")
            .CountAsync(ct);

        return quantidade > 0;
    }

    public async Task<IReadOnlyList<SolicitacaoGestor>> ListarAsync(string? status, CancellationToken ct = default)
    {
        var query = context.Set<SolicitacaoGestor>().AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.Status == status.ToUpper());
        return await query.OrderByDescending(x => x.DataSolicitacao)
            .ThenByDescending(x => x.IdSolicitacaoGestor).ToListAsync(ct);
    }

    public Task<SolicitacaoGestor?> ObterPorIdAsync(long id, CancellationToken ct = default) =>
        context.Set<SolicitacaoGestor>().FirstOrDefaultAsync(x => x.IdSolicitacaoGestor == id, ct);

    public async Task AdicionarAsync(SolicitacaoGestor solicitacao, CancellationToken ct = default)
    {
        await context.Set<SolicitacaoGestor>().AddAsync(solicitacao, ct);
        await context.SaveChangesAsync(ct);
    }

    public Task SalvarAlteracoesAsync(CancellationToken ct = default) => context.SaveChangesAsync(ct);
}
