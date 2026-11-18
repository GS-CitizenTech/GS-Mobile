using AlertaCidadao.Application.Interfaces;
using AlertaCidadao.Domain.Entities;

namespace AlertaCidadao.UnitTests.Fakes;

internal sealed class FakeSolicitacaoGestorRepository : ISolicitacaoGestorRepository
{
    private readonly List<SolicitacaoGestor> _solicitacoes = [];
    private long _nextId = 1;

    public IReadOnlyList<SolicitacaoGestor> Solicitacoes => _solicitacoes;
    public int Salvamentos { get; private set; }

    public Task<bool> ExistePendenteDoUsuarioAsync(long idUsuario, CancellationToken ct = default) =>
        Task.FromResult(_solicitacoes.Any(x =>
            x.IdUsuario == idUsuario && x.Status == "PENDENTE"));

    public Task<IReadOnlyList<SolicitacaoGestor>> ListarAsync(string? status, CancellationToken ct = default)
    {
        IEnumerable<SolicitacaoGestor> query = _solicitacoes;
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult<IReadOnlyList<SolicitacaoGestor>>(query
            .OrderByDescending(x => x.DataSolicitacao)
            .ThenByDescending(x => x.IdSolicitacaoGestor)
            .ToList());
    }

    public Task<SolicitacaoGestor?> ObterPorIdAsync(long id, CancellationToken ct = default) =>
        Task.FromResult(_solicitacoes.FirstOrDefault(x => x.IdSolicitacaoGestor == id));

    public Task AdicionarAsync(SolicitacaoGestor solicitacao, CancellationToken ct = default)
    {
        solicitacao.IdSolicitacaoGestor = _nextId++;
        _solicitacoes.Add(solicitacao);
        return Task.CompletedTask;
    }

    public Task SalvarAlteracoesAsync(CancellationToken ct = default)
    {
        Salvamentos++;
        return Task.CompletedTask;
    }

    public void Inserir(SolicitacaoGestor solicitacao)
    {
        if (solicitacao.IdSolicitacaoGestor == 0)
            solicitacao.IdSolicitacaoGestor = _nextId++;
        _solicitacoes.Add(solicitacao);
    }
}
