using System.Data;
using System.Net.Mail;
using AlertaCidadao.Application.Interfaces;
using AlertaCidadao.Application.Services;
using AlertaCidadao.Infrastructure;
using AlertaCidadao.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

const int tamanhoMinimoSenha = 12;

try
{
    Console.WriteLine("==========================================");
    Console.WriteLine("   ALERTA CIDADÃO - PRIMEIRO GESTOR");
    Console.WriteLine("==========================================");
    Console.WriteLine();

    // 1. Carregar os mesmos User Secrets da API.
    var configuration = new ConfigurationBuilder()
        .AddUserSecrets<Program>()
        .Build();

    var connectionString =
        configuration["ConnectionStrings:Oracle"];

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        Console.WriteLine(
            "ERRO: ConnectionStrings:Oracle não configurada.");

        return 1;
    }

    // 2. Registrar os serviços existentes.
    var services = new ServiceCollection();

    services.AddApplicationServices();
    services.AddInfrastructure(connectionString);

    using var serviceProvider = services.BuildServiceProvider();
    using var scope = serviceProvider.CreateScope();

    var dbContext =
        scope.ServiceProvider.GetRequiredService<AlertaCidadaoDbContext>();

    var passwordHasher =
        scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

    // 3. Solicitar os dados do primeiro gestor.
    Console.Write("Nome completo: ");
    var nome = Console.ReadLine()?.Trim();

    if (string.IsNullOrWhiteSpace(nome) || nome.Length > 120)
    {
        Console.WriteLine("ERRO: Nome inválido.");
        return 1;
    }

    Console.Write("E-mail: ");
    var emailInformado = Console.ReadLine()?.Trim();

    if (string.IsNullOrWhiteSpace(emailInformado) ||
        emailInformado.Length > 180)
    {
        Console.WriteLine("ERRO: E-mail inválido.");
        return 1;
    }

    string email;

    try
    {
        email = new MailAddress(emailInformado)
            .Address
            .ToLowerInvariant();
    }
    catch (FormatException)
    {
        Console.WriteLine("ERRO: Informe um e-mail válido.");
        return 1;
    }

    if (email.Length > 180)
    {
        Console.WriteLine("ERRO: E-mail excede o limite permitido.");
        return 1;
    }

    Console.Write("Telefone (opcional): ");
    var telefone = Console.ReadLine()?.Trim();

    if (string.IsNullOrWhiteSpace(telefone))
    {
        telefone = null;
    }

    if (telefone?.Length > 20)
    {
        Console.WriteLine("ERRO: Telefone excede 20 caracteres.");
        return 1;
    }

    Console.WriteLine();
    Console.WriteLine("A senha não será exibida durante a digitação.");

    var senha = LerSenha("Senha: ");
    var confirmacaoSenha = LerSenha("Confirme a senha: ");

    if (senha.Length < tamanhoMinimoSenha)
    {
        Console.WriteLine(
            $"ERRO: A senha deve possuir pelo menos {tamanhoMinimoSenha} caracteres.");

        return 1;
    }

    if (!string.Equals(
        senha,
        confirmacaoSenha,
        StringComparison.Ordinal))
    {
        Console.WriteLine("ERRO: As senhas não coincidem.");
        return 1;
    }

    // 4. Gerar hash usando o hasher oficial da aplicação.
    var senhaHash = passwordHasher.GerarHash(senha);

    senha = string.Empty;
    confirmacaoSenha = string.Empty;

    // 5. Abrir transação e bloquear a tabela.
    // Isso evita que duas execuções simultâneas criem o primeiro gestor.
    await using var transaction =
        await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.ReadCommitted);

    await dbContext.Database.ExecuteSqlRawAsync(
        "LOCK TABLE USUARIO IN EXCLUSIVE MODE");

    // 6. Verificar se já existe algum gestor,
    // incluindo usuários inativos.
    var gestorExistente = await dbContext.Usuarios
        .AsNoTracking()
        .Where(usuario => usuario.Perfil.ToUpper() == "GESTOR")
        .Select(usuario => usuario.IdUsuario)
        .FirstOrDefaultAsync();

    var gestorExiste = gestorExistente != 0;

    if (gestorExiste)
    {
        Console.WriteLine();
        Console.WriteLine(
            "OPERAÇÃO BLOQUEADA: já existe um usuário com perfil GESTOR.");

        await transaction.RollbackAsync();

        return 1;
    }

    // 7. Verificar duplicidade de e-mail.
    // A consulta retorna o ID em vez de um resultado booleano.
    var emailExistente = await dbContext.Usuarios
        .AsNoTracking()
        .Where(usuario => usuario.Email == email)
        .Select(usuario => usuario.IdUsuario)
        .FirstOrDefaultAsync();

    var emailExiste = emailExistente != 0;

    if (emailExiste)
    {
        Console.WriteLine("ERRO: Este e-mail já está cadastrado.");

        await transaction.RollbackAsync();

        return 1;
    }

    // 8. Criar o primeiro gestor.
    var gestor = new AlertaCidadao.Domain.Entities.Usuario
    {
        Nome = nome,
        Email = email,
        Telefone = telefone,
        SenhaHash = senhaHash,
        Perfil = "GESTOR",
        Ativo = true
    };

    await dbContext.Usuarios.AddAsync(gestor);
    await dbContext.SaveChangesAsync();

    await transaction.CommitAsync();

    Console.WriteLine();
    Console.WriteLine("==========================================");
    Console.WriteLine("PRIMEIRO GESTOR CADASTRADO COM SUCESSO!");
    Console.WriteLine($"ID: {gestor.IdUsuario}");
    Console.WriteLine($"Nome: {gestor.Nome}");
    Console.WriteLine($"E-mail: {gestor.Email}");
    Console.WriteLine($"Perfil: {gestor.Perfil}");
    Console.WriteLine("==========================================");

    return 0;
}
catch (Exception ex)
{
    Console.WriteLine();
    Console.WriteLine("ERRO DURANTE O PROVISIONAMENTO.");
    Console.WriteLine("Detalhes completos:");

    Console.WriteLine(ex);

    if (ex.InnerException != null)
    {
        Console.WriteLine();
        Console.WriteLine("ERRO INTERNO:");
        Console.WriteLine(ex.InnerException);
    }

    return 1;
}

static string LerSenha(string mensagem)
{
    Console.Write(mensagem);

    var senha = new System.Text.StringBuilder();

    while (true)
    {
        var tecla = Console.ReadKey(intercept: true);

        if (tecla.Key == ConsoleKey.Enter)
        {
            Console.WriteLine();
            break;
        }

        if (tecla.Key == ConsoleKey.Backspace)
        {
            if (senha.Length > 0)
            {
                senha.Length--;
            }

            continue;
        }

        if (!char.IsControl(tecla.KeyChar))
        {
            senha.Append(tecla.KeyChar);
        }
    }

    return senha.ToString();
}