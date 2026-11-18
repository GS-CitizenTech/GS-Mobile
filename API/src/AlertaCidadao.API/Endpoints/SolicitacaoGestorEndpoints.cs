using System.Security.Claims;
using AlertaCidadao.API.Extensions;
using AlertaCidadao.Application.DTOs;
using AlertaCidadao.Application.Services;

namespace AlertaCidadao.API.Endpoints;

public static class SolicitacaoGestorEndpoints
{
    public static void MapSolicitacaoGestorEndpoints(this WebApplication app)
    {
        var grupo = app.MapGroup("/api/usuarios/solicitacoes-gestor")
            .WithTags("Solicitações de gestor")
            .RequireAuthorization();

        grupo.MapPost("/", async Task<IResult> (
            CriarSolicitacaoGestorRequest request,
            ClaimsPrincipal usuario,
            ISolicitacaoGestorService service,
            CancellationToken ct) =>
        {
            var idUsuario = ObterId(usuario);
            if (idUsuario is null) return Results.Unauthorized();
            var validacao = ValidacaoRequest.Validar(request);
            if (validacao is not null) return Results.BadRequest(validacao);
            var resultado = await service.CriarAsync(idUsuario.Value, request, ct);
            if (!resultado.Sucesso) return resultado.ToErrorResult();
            return Results.Created("/api/usuarios/solicitacoes-gestor/minha", resultado.Dados);
        })
        .WithName("CriarSolicitacaoGestor")
        .WithSummary("Solicita a mudança de perfil para gestor.")
        .WithDescription("O usuário autenticado solicita acesso de gestor. A conta só recebe o perfil GESTOR após aprovação por um gestor atual.")
        .Produces<SolicitacaoGestorDto>(StatusCodes.Status201Created)
        .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict);

        grupo.MapGet("/minha", async Task<IResult> (
            ClaimsPrincipal usuario,
            ISolicitacaoGestorService service,
            CancellationToken ct) =>
        {
            var idUsuario = ObterId(usuario);
            if (idUsuario is null) return Results.Unauthorized();
            var resultado = await service.ObterMinhaAsync(idUsuario.Value, ct);
            return resultado.Sucesso ? Results.Ok(resultado.Dados) : resultado.ToErrorResult();
        })
        .WithName("ObterMinhaSolicitacaoGestor")
        .WithSummary("Consulta a solicitação de gestor da conta autenticada.")
        .Produces<SolicitacaoGestorDto>(StatusCodes.Status200OK)
        .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound);

        grupo.MapGet("/", async Task<IResult> (
            string? status,
            ISolicitacaoGestorService service,
            CancellationToken ct) =>
        {
            if (!string.IsNullOrWhiteSpace(status) && status.Trim().ToUpperInvariant() is not ("PENDENTE" or "APROVADA" or "REJEITADA"))
                return ErroValidacao.Campo("status", "O status deve ser PENDENTE, APROVADA ou REJEITADA.");
            return Results.Ok(await service.ListarAsync(status, ct));
        })
        .RequireAuthorization("Gestor")
        .WithName("ListarSolicitacoesGestor")
        .WithSummary("Lista solicitações de acesso de gestor.")
        .Produces<IReadOnlyList<SolicitacaoGestorDto>>(StatusCodes.Status200OK);

        grupo.MapPut("/{id:long}", async Task<IResult> (
            long id,
            DecidirSolicitacaoGestorRequest request,
            ClaimsPrincipal usuario,
            ISolicitacaoGestorService service,
            CancellationToken ct) =>
        {
            var idGestor = ObterId(usuario);
            if (idGestor is null) return Results.Unauthorized();
            var validacao = ValidacaoRequest.Validar(request);
            if (validacao is not null) return Results.BadRequest(validacao);
            var resultado = await service.DecidirAsync(id, idGestor.Value, request, ct);
            return resultado.Sucesso ? Results.Ok(resultado.Dados) : resultado.ToErrorResult();
        })
        .RequireAuthorization("Gestor")
        .WithName("DecidirSolicitacaoGestor")
        .WithSummary("Aprova ou rejeita uma solicitação de gestor.")
        .Produces<SolicitacaoGestorDto>(StatusCodes.Status200OK)
        .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
        .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict);
    }

    private static long? ObterId(ClaimsPrincipal usuario) =>
        long.TryParse(usuario.FindFirstValue(ClaimTypes.NameIdentifier), out var id) && id > 0
            ? id : null;
}
