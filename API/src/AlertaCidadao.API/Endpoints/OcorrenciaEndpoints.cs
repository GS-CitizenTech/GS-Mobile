using System.Security.Claims;
using AlertaCidadao.API.Extensions;
using AlertaCidadao.API.Filters;
using AlertaCidadao.Application.DTOs;
using AlertaCidadao.Application.Services;

namespace AlertaCidadao.API.Endpoints;

public static class OcorrenciaEndpoints
{
    private static readonly string[] StatusPermitidos = ["ABERTA", "EM_ANALISE", "RESOLVIDA", "CANCELADA"];

    public static void MapOcorrenciaEndpoints(this WebApplication app)
    {
        var grupo = app.MapGroup("/api/ocorrencias")
            .WithTags("Ocorrências")
            .RequireAuthorization();

        grupo.MapGet("/", async Task<IResult> (
            ClaimsPrincipal usuario,
            string? status,
            long? idPonto,
            IOcorrenciaService service,
            CancellationToken ct) =>
        {
            if (!long.TryParse(usuario.FindFirstValue(ClaimTypes.NameIdentifier), out var idUsuario) || idUsuario <= 0)
                return Results.Unauthorized();

            if (!string.IsNullOrWhiteSpace(status) && !StatusPermitidos.Contains(status.Trim().ToUpperInvariant()))
                return ErroValidacao.Campo("status", "O status deve ser ABERTA, EM_ANALISE, RESOLVIDA ou CANCELADA.");

            if (idPonto is <= 0)
                return ErroValidacao.Campo("idPonto", "O ID do ponto deve ser maior que zero.");

            var resultado = await service.ListarAsync(
                idUsuario, usuario.IsInRole("GESTOR"), status, idPonto, ct);
            return Results.Ok(resultado);
        })
        .WithName("ListarOcorrencias")
        .WithSummary("Lista ocorrências de acordo com o perfil autenticado.")
        .WithDescription("Cidadãos consultam somente suas próprias ocorrências. Gestores consultam todas. Permite filtrar por status e ponto.")
        .Produces<IReadOnlyList<OcorrenciaDto>>(StatusCodes.Status200OK)
        .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest);

        grupo.MapGet("/{id:long}", async Task<IResult> (
            long id,
            ClaimsPrincipal usuario,
            IOcorrenciaService service,
            CancellationToken ct) =>
        {
            if (!long.TryParse(usuario.FindFirstValue(ClaimTypes.NameIdentifier), out var idUsuario) || idUsuario <= 0)
                return Results.Unauthorized();
            var resultado = await service.ObterPorIdAsync(id, idUsuario, usuario.IsInRole("GESTOR"), ct);
            return resultado.Sucesso ? Results.Ok(resultado.Dados) : resultado.ToErrorResult();
        })
        .WithName("ObterOcorrenciaPorId")
        .WithSummary("Consulta uma ocorrência respeitando a propriedade do registro.")
        .Produces<OcorrenciaDto>(StatusCodes.Status200OK)
        .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound);

        grupo.MapPost("/", async Task<IResult> (
            CriarOcorrenciaRequest request,
            ClaimsPrincipal usuario,
            IOcorrenciaService service,
            CancellationToken ct) =>
        {
            var validacao = ValidacaoRequest.Validar(request);
            if (validacao is not null) return Results.BadRequest(validacao);
            if (!long.TryParse(usuario.FindFirstValue(ClaimTypes.NameIdentifier), out var idUsuario) || idUsuario <= 0)
                return Results.Unauthorized();
            var resultado = await service.CriarAsync(request, idUsuario, ct);
            if (!resultado.Sucesso) return resultado.ToErrorResult();
            return Results.Created($"/api/ocorrencias/{resultado.Dados!.IdOcorrencia}", resultado.Dados);
        })
        .AddEndpointFilter<IdempotencyEndpointFilter>()
        .WithName("CriarOcorrencia")
        .WithSummary("Registra uma ocorrência enviada pelo usuário autenticado.")
        .WithDescription("A ocorrência é vinculada automaticamente ao usuário do JWT e inicia com status ABERTA. Aceita Idempotency-Key.")
        .Produces<OcorrenciaDto>(StatusCodes.Status201Created)
        .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
        .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict);

        grupo.MapPut("/{id:long}", async Task<IResult> (
            long id,
            AtualizarOcorrenciaRequest request,
            ClaimsPrincipal usuario,
            IOcorrenciaService service,
            CancellationToken ct) =>
        {
            var validacao = ValidacaoRequest.Validar(request);
            if (validacao is not null) return Results.BadRequest(validacao);
            if (!long.TryParse(usuario.FindFirstValue(ClaimTypes.NameIdentifier), out var idUsuario) || idUsuario <= 0)
                return Results.Unauthorized();
            var resultado = await service.AtualizarAsync(id, request, idUsuario, usuario.IsInRole("GESTOR"), ct);
            return resultado.Sucesso ? Results.Ok(resultado.Dados) : resultado.ToErrorResult();
        })
        .AddEndpointFilter<IdempotencyEndpointFilter>()
        .WithName("AtualizarOcorrencia")
        .WithSummary("Atualiza uma ocorrência própria ou administrada por gestor.")
        .WithDescription("O cidadão edita somente suas ocorrências ABERTAS. O gestor pode editar qualquer ocorrência e alterar seu status.")
        .Produces<OcorrenciaDto>(StatusCodes.Status200OK)
        .Produces<ApiErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
        .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict);

        grupo.MapDelete("/{id:long}", async Task<IResult> (
            long id,
            ClaimsPrincipal usuario,
            IOcorrenciaService service,
            CancellationToken ct) =>
        {
            if (!long.TryParse(usuario.FindFirstValue(ClaimTypes.NameIdentifier), out var idUsuario) || idUsuario <= 0)
                return Results.Unauthorized();
            var resultado = await service.ExcluirAsync(id, idUsuario, usuario.IsInRole("GESTOR"), ct);
            return resultado.Sucesso ? Results.NoContent() : resultado.ToErrorResult();
        })
        .AddEndpointFilter<IdempotencyEndpointFilter>()
        .WithName("ExcluirOcorrencia")
        .WithSummary("Exclui uma ocorrência própria ou administrada por gestor.")
        .WithDescription("O cidadão pode excluir somente suas ocorrências ABERTAS. O gestor pode excluir qualquer ocorrência.")
        .Produces(StatusCodes.Status204NoContent)
        .Produces<ApiErrorResponse>(StatusCodes.Status404NotFound)
        .Produces<ApiErrorResponse>(StatusCodes.Status409Conflict);
    }
}
