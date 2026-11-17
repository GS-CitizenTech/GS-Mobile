using AlertaCidadao.Application.DTOs;
using AlertaCidadao.Application.Interfaces;
using AlertaCidadao.Application.Services;
using AlertaCidadao.Domain.Entities;

namespace AlertaCidadao.UnitTests.Services;

public sealed class OcorrenciaServiceTests
{
    [Fact]
    public async Task CriarAsync_DeveVincularAoUsuarioAutenticado_EIniciarAberta()
    {
        var usuario = new Usuario { IdUsuario = 21, Nome = "Cidadão Teste", Ativo = true };
        var ocorrencias = new FakeOcorrenciaRepository();
        var service = CriarService(ocorrencias, usuario);
        var request = new CriarOcorrenciaRequest
        {
            Tipo = "ALAGAMENTO",
            Titulo = "Alagamento na avenida",
            Descricao = "A água está acumulando na pista e dificultando a passagem.",
            Cidade = "São Paulo",
            Uf = "SP"
        };

        var resultado = await service.CriarAsync(request, usuario.IdUsuario);

        Assert.True(resultado.Sucesso);
        Assert.NotNull(resultado.Dados);
        Assert.Equal(usuario.IdUsuario, resultado.Dados.IdUsuario);
        Assert.Equal("ABERTA", resultado.Dados.Status);
        Assert.Equal("Cidadão Teste", resultado.Dados.NomeUsuario);
    }

    [Fact]
    public async Task ListarAsync_CidadaoDeveReceberSomenteSuasOcorrencias()
    {
        var repository = new FakeOcorrenciaRepository();
        repository.Items.Add(CriarOcorrencia(1, 21, "Ocorrência do usuário"));
        repository.Items.Add(CriarOcorrencia(2, 22, "Ocorrência de outra pessoa"));
        var service = CriarService(repository, new Usuario { IdUsuario = 21, Nome = "Cidadão", Ativo = true });

        var resultado = await service.ListarAsync(21, gestor: false);

        Assert.Single(resultado);
        Assert.Equal("Ocorrência do usuário", resultado[0].Titulo);
    }

    [Fact]
    public async Task GestorDeveConseguirListarTodasAsOcorrencias()
    {
        var repository = new FakeOcorrenciaRepository();
        repository.Items.Add(CriarOcorrencia(1, 21, "Primeira"));
        repository.Items.Add(CriarOcorrencia(2, 22, "Segunda"));
        var service = CriarService(repository, new Usuario { IdUsuario = 99, Nome = "Gestor", Ativo = true });

        var resultado = await service.ListarAsync(99, gestor: true);

        Assert.Equal(2, resultado.Count);
    }

    [Fact]
    public async Task CidadaoNaoPodeConsultarOuAlterarOcorrenciaDeOutraPessoa()
    {
        var repository = new FakeOcorrenciaRepository();
        repository.Items.Add(CriarOcorrencia(5, 22, "Registro privado"));
        var service = CriarService(repository, new Usuario { IdUsuario = 21, Nome = "Cidadão", Ativo = true });
        var update = new AtualizarOcorrenciaRequest
        {
            Tipo = "ALAGAMENTO",
            Titulo = "Alteração indevida",
            Descricao = "Tentativa de editar ocorrência de outra pessoa.",
            Cidade = "São Paulo"
        };

        var obter = await service.ObterPorIdAsync(5, 21, gestor: false);
        var atualizar = await service.AtualizarAsync(5, update, 21, gestor: false);
        var excluir = await service.ExcluirAsync(5, 21, gestor: false);

        Assert.Equal(TipoErroOperacao.NaoEncontrado, obter.TipoErro);
        Assert.Equal(TipoErroOperacao.NaoEncontrado, atualizar.TipoErro);
        Assert.Equal(TipoErroOperacao.NaoEncontrado, excluir.TipoErro);
    }

    [Fact]
    public async Task CidadaoNaoPodeEditarOuExcluirOcorrenciaQueJaEstaEmAnalise()
    {
        var repository = new FakeOcorrenciaRepository();
        var ocorrencia = CriarOcorrencia(7, 21, "Registro em análise");
        ocorrencia.Status = "EM_ANALISE";
        repository.Items.Add(ocorrencia);
        var service = CriarService(repository, new Usuario { IdUsuario = 21, Nome = "Cidadão", Ativo = true });
        var update = new AtualizarOcorrenciaRequest
        {
            Tipo = "ALAGAMENTO",
            Titulo = "Alterar registro em análise",
            Descricao = "Tentativa de editar enquanto a gestão analisa.",
            Cidade = "São Paulo"
        };

        var atualizar = await service.AtualizarAsync(7, update, 21, gestor: false);
        var excluir = await service.ExcluirAsync(7, 21, gestor: false);

        Assert.Equal(TipoErroOperacao.Conflito, atualizar.TipoErro);
        Assert.Equal(TipoErroOperacao.Conflito, excluir.TipoErro);
    }

    [Fact]
    public async Task GestorPodeAlterarStatusDaOcorrencia()
    {
        var repository = new FakeOcorrenciaRepository();
        repository.Items.Add(CriarOcorrencia(9, 21, "Ocorrência em acompanhamento"));
        var service = CriarService(repository, new Usuario { IdUsuario = 99, Nome = "Gestor", Ativo = true });
        var update = new AtualizarOcorrenciaRequest
        {
            Tipo = "ALAGAMENTO",
            Titulo = "Ocorrência em acompanhamento",
            Descricao = "A equipe verificou e está resolvendo a situação reportada.",
            Cidade = "São Paulo",
            Status = "RESOLVIDA"
        };

        var resultado = await service.AtualizarAsync(9, update, 99, gestor: true);

        Assert.True(resultado.Sucesso);
        Assert.Equal("RESOLVIDA", resultado.Dados!.Status);
    }

    private static OcorrenciaService CriarService(FakeOcorrenciaRepository ocorrencias, Usuario usuario) =>
        new(ocorrencias, new FakeUsuarioRepository(usuario), new FakePontoRepository());

    private static Ocorrencia CriarOcorrencia(long id, long idUsuario, string titulo) => new()
    {
        IdOcorrencia = id,
        IdUsuario = idUsuario,
        Usuario = new Usuario { IdUsuario = idUsuario, Nome = $"Usuário {idUsuario}", Ativo = true },
        Tipo = "ALAGAMENTO",
        Titulo = titulo,
        Descricao = "Descrição de teste suficientemente detalhada.",
        Cidade = "São Paulo",
        Status = "ABERTA",
        DataCriacao = DateTimeOffset.UtcNow
    };

    private sealed class FakeOcorrenciaRepository : IOcorrenciaRepository
    {
        public List<Ocorrencia> Items { get; } = [];

        public Task<IReadOnlyList<Ocorrencia>> ListarAsync(long idUsuario, bool gestor, string? status = null, long? idPonto = null, CancellationToken cancellationToken = default)
        {
            IEnumerable<Ocorrencia> query = Items;
            if (!gestor) query = query.Where(x => x.IdUsuario == idUsuario);
            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
            if (idPonto.HasValue) query = query.Where(x => x.IdPonto == idPonto.Value);
            return Task.FromResult<IReadOnlyList<Ocorrencia>>(query.ToList());
        }

        public Task<Ocorrencia?> ObterPorIdAsync(long id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.FirstOrDefault(x => x.IdOcorrencia == id));

        public Task AdicionarAsync(Ocorrencia ocorrencia, CancellationToken cancellationToken = default)
        {
            ocorrencia.IdOcorrencia = Items.Count == 0 ? 1 : Items.Max(x => x.IdOcorrencia) + 1;
            Items.Add(ocorrencia);
            return Task.CompletedTask;
        }

        public Task SalvarAlteracoesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task RemoverAsync(Ocorrencia ocorrencia, CancellationToken cancellationToken = default)
        {
            Items.Remove(ocorrencia);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeUsuarioRepository(Usuario usuario) : IUsuarioRepository
    {
        public Task<IReadOnlyList<Usuario>> ListarAsync(bool incluirInativos, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<Usuario>>([usuario]);
        public Task<Usuario?> ObterPorIdAsync(long id, CancellationToken ct = default) =>
            Task.FromResult<Usuario?>(id == usuario.IdUsuario ? usuario : null);
        public Task<Usuario?> ObterPorEmailAsync(string email, CancellationToken ct = default) =>
            Task.FromResult<Usuario?>(null);
        public Task<bool> EmailExisteAsync(string email, long? ignorarId = null, CancellationToken ct = default) =>
            Task.FromResult(false);
        public Task AdicionarAsync(Usuario entidade, CancellationToken ct = default) => Task.CompletedTask;
        public Task SalvarAlteracoesAsync(CancellationToken ct = default) => Task.CompletedTask;
        public Task RemoverAsync(Usuario entidade, CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakePontoRepository : IPontoMonitoramentoRepository
    {
        public Task<IReadOnlyList<PontoMonitoramento>> ListarAtivosAsync(CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<PontoMonitoramento>>([]);
        public Task<IReadOnlyList<PontoMonitoramento>> ListarTodosAsync(CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<PontoMonitoramento>>([]);
        public Task<PontoMonitoramento?> ObterPorIdAsync(long id, CancellationToken ct = default) =>
            Task.FromResult<PontoMonitoramento?>(null);
        public Task<bool> CodigoExisteAsync(string codigo, long? ignorarId = null, CancellationToken ct = default) =>
            Task.FromResult(false);
        public Task AdicionarAsync(PontoMonitoramento ponto, CancellationToken ct = default) => Task.CompletedTask;
        public Task SalvarAlteracoesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }
}
