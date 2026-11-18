using AlertaCidadao.Application.Interfaces;
using AlertaCidadao.Domain.Entities;
using AlertaCidadao.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AlertaCidadao.Infrastructure.Repositories;

public sealed class UsuarioRepository(AlertaCidadaoDbContext context)
    : IUsuarioRepository
{
    public async Task<IReadOnlyList<Usuario>> ListarAsync(
        bool incluirInativos,
        CancellationToken ct = default)
    {
        var usuarios = await context.Usuarios
            .AsNoTracking()
            .OrderBy(x => x.Nome)
            .ThenBy(x => x.IdUsuario)
            .ToListAsync(ct);

        // Aplicar o filtro bool em memória evita a falha de tradução
        // bool/int do provider Oracle para a coluna ATIVO (NUMBER(1)).
        return incluirInativos
            ? usuarios
            : usuarios.Where(x => x.Ativo).ToList();
    }

    public Task<Usuario?> ObterPorIdAsync(
        long id,
        CancellationToken ct = default) =>
        context.Usuarios.FirstOrDefaultAsync(x => x.IdUsuario == id, ct);

    public Task<Usuario?> ObterPorEmailAsync(
        string email,
        CancellationToken ct = default) =>
        context.Usuarios.FirstOrDefaultAsync(x => x.Email == email, ct);

    public async Task<bool> EmailExisteAsync(
        string email,
        long? ignorarId = null,
        CancellationToken ct = default)
    {
        var query = context.Usuarios
            .AsNoTracking()
            .Where(x => x.Email == email);

        if (ignorarId.HasValue)
            query = query.Where(x => x.IdUsuario != ignorarId.Value);

        return await query.CountAsync(ct) > 0;
    }

    public async Task AdicionarAsync(
        Usuario entidade,
        CancellationToken ct = default)
    {
        await context.Usuarios.AddAsync(entidade, ct);
        await context.SaveChangesAsync(ct);
    }

    public Task SalvarAlteracoesAsync(CancellationToken ct = default) =>
        context.SaveChangesAsync(ct);

    public async Task RemoverAsync(
        Usuario entidade,
        CancellationToken ct = default)
    {
        context.Usuarios.Remove(entidade);
        await context.SaveChangesAsync(ct);
    }
}
