using AlertaCidadao.API.Authentication;
using AlertaCidadao.API.Filters;
using AlertaCidadao.API.Extensions;
using AlertaCidadao.Application.DTOs;
using AlertaCidadao.Application.Interfaces;
using AlertaCidadao.Application.Services;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace AlertaCidadao.API.Endpoints;

/// <summary>
/// Define os endpoints de gerenciamento de usuários.
/// </summary>
public static class UsuarioEndpoints
{
    public static void MapUsuarioEndpoints(this WebApplication app)
    {
        var grupo = app.MapGroup("/api/usuarios")
            .WithTags("Usuários");

        // Login: máximo de 5 requisições por minuto por endereço IP.
        grupo.MapPost("/login", async Task<IResult> (
            LoginRequest request,
            IUsuarioRepository repository,
            IPasswordHasher passwordHasher,
            ITokenService tokenService,
            CancellationToken ct) =>
        {
            var validacao = ValidacaoRequest.Validar(request);
            if (validacao is not null)
                return Results.BadRequest(validacao);

            var email = request.Email.Trim().ToLowerInvariant();
            var usuario = await repository.ObterPorEmailAsync(email, ct);

            // Não revela a existência da conta quando a senha estiver incorreta.
            if (usuario is null ||
                !passwordHasher.VerificarSenha(request.Senha, usuario.SenhaHash))
            {
                return Results.Unauthorized();
            }

            if (!usuario.Ativo)
            {
                return Results.Json(
                    new ApiErrorResponse(
                        "CONTA_INATIVA",
                        "Sua conta está inativa. Entre em contato com um gestor para solicitar a reativação.",
                        null,
                        DateTimeOffset.UtcNow),
                    statusCode: StatusCodes.Status403Forbidden);
            }

            var (token, expiraEm) = tokenService.GerarToken(usuario);

            return Results.Ok(new LoginResponse(
                token,
                "Bearer",
                expiraEm,
                usuario.IdUsuario,
                usuario.Nome,
                usuario.Email,
                usuario.Perfil));
        })
        .WithName("Login")
        .WithSummary("Autentica um usuário e retorna um token JWT.")
        .AllowAnonymous()
        .RequireRateLimiting("Login")
        .Produces<LoginResponse>(StatusCodes.Status200OK)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces<ApiErrorResponse>(StatusCodes.Status403Forbidden)
        .Produces(StatusCodes.Status429TooManyRequests);

        // Cadastro público: máximo de 10 requisições por minuto por endereço IP.
        grupo.MapPost("/", async Task<IResult> (
            CriarUsuarioRequest request,
            IUsuarioService service,
            CancellationToken ct) =>
        {
            var validacao = ValidacaoRequest.Validar(request);
            if (validacao is not null)
                return Results.BadRequest(validacao);

            var resultado = await service.CriarAsync(request, ct);

            if (!resultado.Sucesso)
                return resultado.ToErrorResult();

            return Results.Created(
                $"/api/usuarios/{resultado.Dados!.IdUsuario}",
                resultado.Dados);
        })
        .AddEndpointFilter<IdempotencyEndpointFilter>()
        .WithName("CriarUsuario")
        .WithSummary("Cadastra um novo cidadão.")
        .WithDescription(
            "O cadastro público cria usuários com perfil CIDADAO. " +
            "A senha é armazenada usando PBKDF2-SHA256.")
        .AllowAnonymous()
        .RequireRateLimiting("Cadastro")
        .Produces<UsuarioDto>(StatusCodes.Status201Created)
        .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict)
        .Produces(StatusCodes.Status429TooManyRequests);

        // Cadastro de gestores: somente um gestor autenticado pode criar outro gestor.
        grupo.MapPost("/gestores", async Task<IResult> (
            CriarUsuarioRequest request,
            IUsuarioRepository repository,
            IPasswordHasher passwordHasher,
            CancellationToken ct) =>
        {
            var validacao = ValidacaoRequest.Validar(request);
            if (validacao is not null) return Results.BadRequest(validacao);

            var email = request.Email.Trim().ToLowerInvariant();
            var usuarioExistente = await repository.ObterPorEmailAsync(email, ct);
            if (usuarioExistente is not null)
            {
                var mensagem = usuarioExistente.Ativo
                    ? "Este e-mail já está cadastrado."
                    : "Este e-mail pertence a uma conta inativa. Entre em contato com um gestor para solicitar a reativação.";
                return Results.Conflict(new ApiErrorResponse(
                    "CONFLITO", mensagem, null, DateTimeOffset.UtcNow));
            }

            var gestor = new AlertaCidadao.Domain.Entities.Usuario
            {
                Nome = request.Nome.Trim(),
                Email = email,
                Telefone = string.IsNullOrWhiteSpace(request.Telefone) ? null : request.Telefone.Trim(),
                SenhaHash = passwordHasher.GerarHash(request.Senha),
                Perfil = "GESTOR",
                Ativo = true,
                DataCadastro = DateTimeOffset.UtcNow
            };

            await repository.AdicionarAsync(gestor, ct);
            var dto = new UsuarioDto(gestor.IdUsuario, gestor.Nome, gestor.Email, gestor.Telefone, gestor.Perfil, gestor.Ativo, gestor.DataCadastro);
            return Results.Created($"/api/usuarios/{gestor.IdUsuario}", dto);
        })
        .AddEndpointFilter<IdempotencyEndpointFilter>()
        .RequireAuthorization("Gestor")
        .WithName("CriarGestor")
        .WithSummary("Cadastra outro gestor a partir de uma conta gestora autenticada.")
        .WithDescription("Apenas um gestor autenticado pode criar outro usuário com perfil GESTOR.")
        .Produces<UsuarioDto>(StatusCodes.Status201Created)
        .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict);

        // Listagem: acesso exclusivo ao perfil GESTOR.
        grupo.MapGet("/", async Task<IResult> (
            IUsuarioService service,
            bool? incluirInativos,
            CancellationToken ct) =>
        {
            return Results.Ok(
                await service.ListarAsync(incluirInativos == true, ct));
        })
        .WithName("ListarUsuarios")
        .WithSummary("Lista os usuários cadastrados.")
        .RequireAuthorization("Gestor")
        .Produces<IReadOnlyList<UsuarioDto>>(StatusCodes.Status200OK);

        // Consulta individual: acesso exclusivo ao perfil GESTOR.
        grupo.MapGet("/{id:long}", async Task<IResult> (
            long id,
            IUsuarioService service,
            CancellationToken ct) =>
        {
            var resultado = await service.ObterPorIdAsync(id, ct);

            return resultado.Sucesso
                ? Results.Ok(resultado.Dados)
                : resultado.ToErrorResult();
        })
        .WithName("ObterUsuarioPorId")
        .WithSummary("Consulta um usuário pelo ID.")
        .RequireAuthorization("Gestor")
        .Produces<UsuarioDto>(StatusCodes.Status200OK)
        .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound);

        // Atualização: acesso exclusivo ao perfil GESTOR.
        grupo.MapPut("/{id:long}", async Task<IResult> (
            long id,
            AtualizarUsuarioRequest request,
            IUsuarioService service,
            CancellationToken ct) =>
        {
            var validacao = ValidacaoRequest.Validar(request);
            if (validacao is not null)
                return Results.BadRequest(validacao);

            var resultado = await service.AtualizarAsync(id, request, ct);

            return resultado.Sucesso
                ? Results.Ok(resultado.Dados)
                : resultado.ToErrorResult();
        })
        .AddEndpointFilter<IdempotencyEndpointFilter>()
        .WithName("AtualizarUsuario")
        .WithSummary("Atualiza um usuário existente.")
        .RequireAuthorization("Gestor")
        .Produces<UsuarioDto>(StatusCodes.Status200OK)
        .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
        .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict);

        // Ativação/desativação: operação separada da edição cadastral.
        grupo.MapPatch("/{id:long}/status", async Task<IResult> (
            long id,
            AtualizarStatusUsuarioRequest request,
            IUsuarioService service,
            ClaimsPrincipal principal,
            CancellationToken ct) =>
        {
            if (!long.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var idGestor))
                return Results.Unauthorized();

            var resultado = await service.AtualizarStatusAsync(id, idGestor, request.Ativo, ct);
            return resultado.Sucesso
                ? Results.Ok(resultado.Dados)
                : resultado.ToErrorResult();
        })
        .WithName("AtualizarStatusUsuario")
        .WithSummary("Ativa ou desativa uma conta de usuário.")
        .RequireAuthorization("Gestor")
        .Produces<UsuarioDto>(StatusCodes.Status200OK)
        .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
        .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict);

        // Exclusão física: remove a conta e dados administrativos associados.
        grupo.MapDelete("/{id:long}", async Task<IResult> (
            long id,
            IUsuarioService service,
            ClaimsPrincipal principal,
            CancellationToken ct) =>
        {
            if (!long.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var idGestor))
                return Results.Unauthorized();

            var resultado = await service.ExcluirAsync(id, idGestor, ct);
            return resultado.Sucesso
                ? Results.NoContent()
                : resultado.ToErrorResult();
        })
        .WithName("ExcluirUsuarioPermanentemente")
        .WithSummary("Exclui permanentemente uma conta de usuário.")
        .WithDescription("Remove o acesso e solicitações de gestão associadas; ocorrências são preservadas sem vínculo com a conta excluída.")
        .RequireAuthorization("Gestor")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
        .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict);
    }
}
