using AlertaCidadao.Application.DTOs;
using AlertaCidadao.Application.Services;
using AlertaCidadao.Domain.Entities;
using AlertaCidadao.UnitTests.Fakes;

namespace AlertaCidadao.UnitTests.Services;

public sealed class SolicitacaoGestorServiceTests
{
    private readonly FakeUsuarioRepository _usuarios = new();
    private readonly FakeSolicitacaoGestorRepository _solicitacoes = new();

    private SolicitacaoGestorService CriarServico() => new(_solicitacoes, _usuarios);

    [Fact]
    public async Task CriarAsync_ComCidadaoValido_DeveCriarSolicitacaoPendente()
    {
        _usuarios.Inserir(new Usuario
        {
            Nome = "Ana Silva",
            Email = "ana@example.com",
            Perfil = "CIDADAO",
            Ativo = true
        });

        var resultado = await CriarServico().CriarAsync(1, new CriarSolicitacaoGestorRequest
        {
            Motivo = "  Preciso administrar os pontos da minha regiao.  "
        });

        Assert.True(resultado.Sucesso);
        Assert.NotNull(resultado.Dados);
        Assert.Equal("PENDENTE", resultado.Dados.Status);
        Assert.Equal("Preciso administrar os pontos da minha regiao.", resultado.Dados.Motivo);
        Assert.Single(_solicitacoes.Solicitacoes);
    }

    [Fact]
    public async Task CriarAsync_ComSolicitacaoPendente_DeveImpedirDuplicidade()
    {
        _usuarios.Inserir(new Usuario
        {
            Nome = "Ana Silva",
            Email = "ana@example.com",
            Perfil = "CIDADAO",
            Ativo = true
        });
        _solicitacoes.Inserir(new SolicitacaoGestor
        {
            IdUsuario = 1,
            Motivo = "Primeiro pedido de acesso.",
            Status = "PENDENTE",
            DataSolicitacao = DateTimeOffset.UtcNow
        });

        var resultado = await CriarServico().CriarAsync(1, new CriarSolicitacaoGestorRequest
        {
            Motivo = "Segundo pedido de acesso administrativo."
        });

        Assert.False(resultado.Sucesso);
        Assert.Equal(TipoErroOperacao.Conflito, resultado.TipoErro);
        Assert.Single(_solicitacoes.Solicitacoes);
    }

    [Fact]
    public async Task CriarAsync_QuandoUsuarioJaEGestor_DeveImpedirNovaSolicitacao()
    {
        _usuarios.Inserir(new Usuario
        {
            Nome = "Gestor atual",
            Email = "gestor@example.com",
            Perfil = "GESTOR",
            Ativo = true
        });

        var resultado = await CriarServico().CriarAsync(1, new CriarSolicitacaoGestorRequest
        {
            Motivo = "Quero solicitar acesso novamente."
        });

        Assert.False(resultado.Sucesso);
        Assert.Equal(TipoErroOperacao.Conflito, resultado.TipoErro);
        Assert.Empty(_solicitacoes.Solicitacoes);
    }

    [Fact]
    public async Task DecidirAsync_AprovandoSolicitacao_DevePromoverUsuarioParaGestor()
    {
        _usuarios.Inserir(new Usuario
        {
            Nome = "Ana Silva",
            Email = "ana@example.com",
            Perfil = "CIDADAO",
            Ativo = true
        });
        _usuarios.Inserir(new Usuario
        {
            Nome = "Gestor atual",
            Email = "gestor@example.com",
            Perfil = "GESTOR",
            Ativo = true
        });
        _solicitacoes.Inserir(new SolicitacaoGestor
        {
            IdUsuario = 1,
            Motivo = "Preciso administrar os registros.",
            Status = "PENDENTE",
            DataSolicitacao = DateTimeOffset.UtcNow
        });

        var resultado = await CriarServico().DecidirAsync(1, 2, new DecidirSolicitacaoGestorRequest
        {
            Status = "APROVADA",
            Observacao = "Acesso autorizado."
        });

        Assert.True(resultado.Sucesso);
        Assert.Equal("GESTOR", _usuarios.Usuarios.Single(x => x.IdUsuario == 1).Perfil);
        Assert.Equal("APROVADA", _solicitacoes.Solicitacoes.Single().Status);
        Assert.Equal((long?)2, resultado.Dados!.IdGestorResponsavel);
        Assert.Equal("Acesso autorizado.", resultado.Dados.ObservacaoDecisao);
    }

    [Fact]
    public async Task DecidirAsync_RejeitandoSolicitacao_DeveManterPerfilCidadao()
    {
        _usuarios.Inserir(new Usuario
        {
            Nome = "Ana Silva",
            Email = "ana@example.com",
            Perfil = "CIDADAO",
            Ativo = true
        });
        _usuarios.Inserir(new Usuario
        {
            Nome = "Gestor atual",
            Email = "gestor@example.com",
            Perfil = "GESTOR",
            Ativo = true
        });
        _solicitacoes.Inserir(new SolicitacaoGestor
        {
            IdUsuario = 1,
            Motivo = "Preciso administrar os registros.",
            Status = "PENDENTE",
            DataSolicitacao = DateTimeOffset.UtcNow
        });

        var resultado = await CriarServico().DecidirAsync(1, 2, new DecidirSolicitacaoGestorRequest
        {
            Status = "REJEITADA"
        });

        Assert.True(resultado.Sucesso);
        Assert.Equal("CIDADAO", _usuarios.Usuarios.Single(x => x.IdUsuario == 1).Perfil);
        Assert.Equal("REJEITADA", _solicitacoes.Solicitacoes.Single().Status);
    }
}
