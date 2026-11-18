$ErrorActionPreference = 'Stop'

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " ALERTA CIDADAO - CARGA DE DADOS FICTICIOS" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

$apiPath = Join-Path $PSScriptRoot 'API'
if (-not (Test-Path (Join-Path $apiPath 'AlertaCidadao.sln'))) {
    throw "Nao encontrei API\AlertaCidadao.sln. Salve este arquivo na pasta GS-Mobile (ao lado da pasta API)."
}

$seedPath = Join-Path $apiPath 'tools\AlertaCidadao.SeedData'
New-Item -ItemType Directory -Path $seedPath -Force | Out-Null

$csproj = @'
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <ProjectReference Include="..\..\src\AlertaCidadao.Application\AlertaCidadao.Application.csproj" />
    <ProjectReference Include="..\..\src\AlertaCidadao.Domain\AlertaCidadao.Domain.csproj" />
    <ProjectReference Include="..\..\src\AlertaCidadao.Infrastructure\AlertaCidadao.Infrastructure.csproj" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.Configuration.UserSecrets" Version="9.0.0" />
  </ItemGroup>
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net9.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <UserSecretsId>d2bac569-18f6-48f5-b8f6-d6569a5aaf9b</UserSecretsId>
  </PropertyGroup>
</Project>
'@
Set-Content -Path (Join-Path $seedPath 'AlertaCidadao.SeedData.csproj') -Value $csproj -Encoding UTF8

$program = @'
using AlertaCidadao.Application.Interfaces;
using AlertaCidadao.Application.Services;
using AlertaCidadao.Domain.Entities;
using AlertaCidadao.Infrastructure;
using AlertaCidadao.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

try
{
    Console.WriteLine("Carregando configuracao Oracle dos User Secrets da API...");
    var configuration = new ConfigurationBuilder()
        .AddUserSecrets<Program>()
        .Build();

    var connectionString = configuration["ConnectionStrings:Oracle"];
    if (string.IsNullOrWhiteSpace(connectionString))
        throw new InvalidOperationException("ConnectionStrings:Oracle nao foi encontrada nos User Secrets.");

    var services = new ServiceCollection();
    services.AddApplicationServices();
    services.AddInfrastructure(connectionString);

    using var provider = services.BuildServiceProvider();
    using var scope = provider.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AlertaCidadaoDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

    if (!await db.Database.CanConnectAsync())
        throw new InvalidOperationException("Nao foi possivel conectar ao Oracle.");

    await using var transaction = await db.Database.BeginTransactionAsync();

    const string senhaPadrao = "Cidadao@2026!";
    var agora = DateTimeOffset.UtcNow;

    Console.WriteLine("\n[1/5] Criando cidadaos ficticios...");
    var definicoesUsuarios = new[]
    {
        (Nome: "Ana Silva - DEMO", Email: "ana.silva.demo@alertacidadao.com", Telefone: "11990001001"),
        (Nome: "Bruno Santos - DEMO", Email: "bruno.santos.demo@alertacidadao.com", Telefone: "11990001002"),
        (Nome: "Carla Oliveira - DEMO", Email: "carla.oliveira.demo@alertacidadao.com", Telefone: "11990001003"),
        (Nome: "Diego Costa - DEMO", Email: "diego.costa.demo@alertacidadao.com", Telefone: "11990001004"),
        (Nome: "Mariana Souza - DEMO", Email: "mariana.souza.demo@alertacidadao.com", Telefone: "11990001005")
    };

    var usuarios = new List<Usuario>();
    foreach (var item in definicoesUsuarios)
    {
        var usuario = await db.Usuarios.FirstOrDefaultAsync(x => x.Email == item.Email);
        if (usuario is null)
        {
            usuario = new Usuario
            {
                Nome = item.Nome,
                Email = item.Email,
                Telefone = item.Telefone,
                SenhaHash = hasher.GerarHash(senhaPadrao),
                Perfil = "CIDADAO",
                Ativo = true,
                DataCadastro = agora
            };
            db.Usuarios.Add(usuario);
            await db.SaveChangesAsync();
            Console.WriteLine($"  + {usuario.Email}");
        }
        else
        {
            Console.WriteLine($"  = Ja existia: {usuario.Email}");
        }
        usuarios.Add(usuario);
    }

    Console.WriteLine("\n[2/5] Criando pontos de monitoramento...");
    var definicoesPontos = new[]
    {
        new PontoMonitoramento { Codigo = "MOCK-SP-001", Nome = "Rio Tiete - Ponte das Bandeiras", Descricao = "Ponto demonstrativo de monitoramento do nivel do rio", Logradouro = "Av. Santos Dumont", Bairro = "Santana", Cidade = "Sao Paulo", Uf = "SP", Latitude = -23.516900m, Longitude = -46.625000m, Ativo = true, DataCadastro = agora },
        new PontoMonitoramento { Codigo = "MOCK-SP-002", Nome = "Córrego do Ipiranga", Descricao = "Monitoramento demonstrativo de chuva e elevacao da agua", Logradouro = "Av. Teresa Cristina", Bairro = "Ipiranga", Cidade = "Sao Paulo", Uf = "SP", Latitude = -23.589500m, Longitude = -46.609200m, Ativo = true, DataCadastro = agora },
        new PontoMonitoramento { Codigo = "MOCK-SP-003", Nome = "Rio Pinheiros - Santo Amaro", Descricao = "Ponto demonstrativo proximo a margem do Rio Pinheiros", Logradouro = "Av. Guido Caloi", Bairro = "Santo Amaro", Cidade = "Sao Paulo", Uf = "SP", Latitude = -23.654000m, Longitude = -46.717000m, Ativo = true, DataCadastro = agora },
        new PontoMonitoramento { Codigo = "MOCK-SP-004", Nome = "Córrego Aricanduva", Descricao = "Monitoramento demonstrativo de risco de alagamento", Logradouro = "Av. Aricanduva", Bairro = "Vila Matilde", Cidade = "Sao Paulo", Uf = "SP", Latitude = -23.565000m, Longitude = -46.670000m, Ativo = true, DataCadastro = agora },
        new PontoMonitoramento { Codigo = "MOCK-SP-005", Nome = "Rio Tamanduatei - Mooca", Descricao = "Ponto demonstrativo de acompanhamento hidrologico", Logradouro = "Av. do Estado", Bairro = "Mooca", Cidade = "Sao Paulo", Uf = "SP", Latitude = -23.556000m, Longitude = -46.603000m, Ativo = true, DataCadastro = agora }
    };

    var pontos = new List<PontoMonitoramento>();
    foreach (var definicao in definicoesPontos)
    {
        var ponto = await db.PontosMonitoramento.FirstOrDefaultAsync(x => x.Codigo == definicao.Codigo);
        if (ponto is null)
        {
            db.PontosMonitoramento.Add(definicao);
            await db.SaveChangesAsync();
            ponto = definicao;
            Console.WriteLine($"  + {ponto.Codigo} - {ponto.Nome}");
        }
        else Console.WriteLine($"  = Ja existia: {ponto.Codigo}");
        pontos.Add(ponto);
    }

    Console.WriteLine("\n[3/5] Criando leituras de enchente e alertas relacionados...");
    var leituras = new[]
    {
        (Ponto: 0, Nivel: 18m, Chuva: 2m, Elevacao: 0.5m, Classificacao: "BAIXO", Prob: 0.1200m, Status: "RESOLVIDO"),
        (Ponto: 1, Nivel: 42m, Chuva: 12m, Elevacao: 2.5m, Classificacao: "MODERADO", Prob: 0.4800m, Status: "ATIVO"),
        (Ponto: 2, Nivel: 68m, Chuva: 28m, Elevacao: 5.8m, Classificacao: "ALTO", Prob: 0.7900m, Status: "ATIVO"),
        (Ponto: 3, Nivel: 95m, Chuva: 46m, Elevacao: 9.2m, Classificacao: "CRITICO", Prob: 0.9600m, Status: "ATIVO"),
        (Ponto: 4, Nivel: 57m, Chuva: 21m, Elevacao: 4.1m, Classificacao: "ALTO", Prob: 0.7300m, Status: "ATIVO")
    };

    for (var i = 0; i < leituras.Length; i++)
    {
        var item = leituras[i];
        var chave = $"MOCK-SEED-LEITURA-{i + 1:000}";
        var leitura = await db.LeiturasEnchente.FirstOrDefaultAsync(x => x.ChaveEvento == chave);
        if (leitura is null)
        {
            leitura = new LeituraEnchente
            {
                IdPonto = pontos[item.Ponto].IdPonto,
                NivelAguaCm = item.Nivel,
                ChuvaMm = item.Chuva,
                ElevacaoCmH = item.Elevacao,
                DataHoraLeitura = agora.AddMinutes(-15 * i),
                Origem = "SIMULACAO",
                ChaveEvento = chave,
                DataRecebimento = agora
            };
            db.LeiturasEnchente.Add(leitura);
            await db.SaveChangesAsync();
            Console.WriteLine($"  + Leitura {leitura.IdLeitura} no ponto {pontos[item.Ponto].Codigo}");
        }
        var alertaExistente = await db.Alertas.FirstOrDefaultAsync(x => x.IdLeitura == leitura.IdLeitura);
        if (alertaExistente is null)
        {
            db.Alertas.Add(new Alerta
            {
                IdLeitura = leitura.IdLeitura,
                Classificacao = item.Classificacao,
                Probabilidade = item.Prob,
                MensagemExplicativa = $"DADO FICTICIO PARA TESTE: nivel de agua {item.Nivel} cm, chuva {item.Chuva} mm e elevacao {item.Elevacao} cm/h no ponto {pontos[item.Ponto].Nome}.",
                TipoMensagem = "PUSH",
                ModeloMl = "MOCK-SEED-v1",
                Status = item.Status,
                DataGeracao = agora.AddMinutes(-15 * i),
                DataResolucao = item.Status == "RESOLVIDO" ? agora.AddMinutes(-5) : null
            });
            await db.SaveChangesAsync();
            Console.WriteLine($"  + Alerta {item.Classificacao} para leitura {leitura.IdLeitura}");
        }
        else Console.WriteLine($"  = Alerta ja existia para leitura {leitura.IdLeitura}");
    }

    Console.WriteLine("\n[4/5] Criando ocorrencias vinculadas aos cidadaos e pontos...");
    var definicoesOcorrencias = new[]
    {
        (Usuario: 0, Ponto: 3, Tipo: "ALAGAMENTO", Titulo: "MOCK - Alagamento na Avenida Aricanduva", Descricao: "Agua acumulada na via, dificultando a passagem de carros e pedestres. Registro ficticio para demonstracao.", Status: "ABERTA"),
        (Usuario: 1, Ponto: 0, Tipo: "ENXURRADA", Titulo: "MOCK - Correnteza forte proxima a ponte", Descricao: "Moradores relatam correnteza acima do normal nas proximidades da ponte. Registro ficticio para demonstracao.", Status: "EM_ANALISE"),
        (Usuario: 2, Ponto: 1, Tipo: "BUEIRO_ENTUPIDO", Titulo: "MOCK - Bueiro obstruido no Ipiranga", Descricao: "Bueiro aparenta estar obstruido por residuos e a agua da chuva nao esta escoando. Registro ficticio.", Status: "ABERTA"),
        (Usuario: 3, Ponto: 2, Tipo: "ALAGAMENTO", Titulo: "MOCK - Pista alagada em Santo Amaro", Descricao: "Trecho da pista apresenta acumulacao de agua apos chuva intensa. Registro ficticio para demonstracao.", Status: "RESOLVIDA"),
        (Usuario: 4, Ponto: 4, Tipo: "RISCO_ESTRUTURAL", Titulo: "MOCK - Suspeita de dano em margem do rio", Descricao: "Foi observado desgaste aparente na margem proxima ao ponto de monitoramento. Registro ficticio.", Status: "EM_ANALISE"),
        (Usuario: 0, Ponto: 1, Tipo: "ALAGAMENTO", Titulo: "MOCK - Agua acumulada em rua residencial", Descricao: "Agua acumulada na rua e proxima as calcadas, exigindo atencao de pedestres. Registro ficticio.", Status: "ABERTA"),
        (Usuario: 1, Ponto: 3, Tipo: "OUTRO", Titulo: "MOCK - Tampa de bueiro deslocada", Descricao: "Tampa de bueiro parece deslocada e pode oferecer risco a quem passa pelo local. Registro ficticio.", Status: "CANCELADA"),
        (Usuario: 2, Ponto: 4, Tipo: "ENXURRADA", Titulo: "MOCK - Escoamento intenso na via", Descricao: "Escoamento superficial intenso observado durante chuva. Registro ficticio para demonstracao.", Status: "ABERTA")
    };

    for (var i = 0; i < definicoesOcorrencias.Length; i++)
    {
        var item = definicoesOcorrencias[i];
        var existente = await db.Ocorrencias.FirstOrDefaultAsync(x => x.Titulo == item.Titulo);
        if (existente is not null)
        {
            Console.WriteLine($"  = Ja existia: {item.Titulo}");
            continue;
        }
        var ponto = pontos[item.Ponto];
        db.Ocorrencias.Add(new Ocorrencia
        {
            IdUsuario = usuarios[item.Usuario].IdUsuario,
            IdPonto = ponto.IdPonto,
            Tipo = item.Tipo,
            Titulo = item.Titulo,
            Descricao = item.Descricao,
            Logradouro = ponto.Logradouro,
            Bairro = ponto.Bairro,
            Cidade = ponto.Cidade,
            Uf = ponto.Uf,
            Latitude = ponto.Latitude,
            Longitude = ponto.Longitude,
            Status = item.Status,
            DataCriacao = agora.AddHours(-i * 3),
            DataAtualizacao = item.Status == "ABERTA" ? null : agora.AddHours(-i * 2)
        });
        await db.SaveChangesAsync();
        Console.WriteLine($"  + {item.Status}: {item.Titulo}");
    }

    Console.WriteLine("\n[5/5] Resumo dos dados de demonstracao:");
    Console.WriteLine($"  Cidadaos DEMO: {await db.Usuarios.CountAsync(x => x.Email.EndsWith("@alertacidadao.com"))}");
    Console.WriteLine($"  Pontos MOCK: {await db.PontosMonitoramento.CountAsync(x => x.Codigo.StartsWith("MOCK-SP-"))}");
    Console.WriteLine($"  Leituras MOCK: {await db.LeiturasEnchente.CountAsync(x => x.ChaveEvento != null && x.ChaveEvento.StartsWith("MOCK-SEED-"))}");
    Console.WriteLine($"  Alertas MOCK: {await db.Alertas.CountAsync(x => x.ModeloMl == "MOCK-SEED-v1")}");
    Console.WriteLine($"  Ocorrencias MOCK: {await db.Ocorrencias.CountAsync(x => x.Titulo.StartsWith("MOCK -"))}");

    await transaction.CommitAsync();

    Console.WriteLine("\nCARGA CONCLUIDA. Nenhum registro existente foi apagado.");
    Console.WriteLine("SENHA DE TODOS OS CIDADAOS DEMO: " + senhaPadrao);
    Console.WriteLine("Use qualquer e-mail listado no script para entrar como CIDADAO.");
}
catch (Exception ex)
{
    Console.WriteLine("\nERRO AO INSERIR DADOS FICTICIOS:");
    Console.WriteLine(ex);
    if (ex.InnerException is not null)
        Console.WriteLine("ERRO INTERNO: " + ex.InnerException.Message);
    Environment.ExitCode = 1;
}
'@

# Corrige uma coordenada digitada como texto para manter o literal decimal valido em C#.
Set-Content -Path (Join-Path $seedPath 'Program.cs') -Value $program -Encoding UTF8

Write-Host "Arquivos da ferramenta preparados. Executando carga no Oracle..." -ForegroundColor Yellow
dotnet run --project (Join-Path $seedPath 'AlertaCidadao.SeedData.csproj')
if ($LASTEXITCODE -ne 0) {
    throw "A ferramenta de carga terminou com erro. Confira a mensagem acima."
}
