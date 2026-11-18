using System.Text.RegularExpressions;
using System.Data.Common;
using AlertaCidadao.Application.DTOs;
using Microsoft.EntityFrameworkCore;

namespace AlertaCidadao.API.Extensions;

public sealed class OracleExceptionMiddleware
{
    private static readonly Regex CodigoOracleRegex =
        new(@"ORA-\d{5}", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private readonly RequestDelegate _next;
    private readonly ILogger<OracleExceptionMiddleware> _logger;

    public OracleExceptionMiddleware(
        RequestDelegate next,
        ILogger<OracleExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            throw;
        }
        catch (DbUpdateException exception)
        {
            // Registra a exceção completa no log do servidor para preservar
            // o ORA-xxxxx e o nome da coluna/tabela envolvidos. A resposta
            // enviada ao aplicativo continua sem detalhes internos.
            _logger.LogError(
                exception,
                "Falha de persistência Oracle. TraceId: {TraceId}. Método: {Method}. Rota: {Path}",
                context.TraceIdentifier,
                context.Request.Method,
                context.Request.Path);
            await EscreverErroOracleAsync(context, exception);
        }
        catch (DbException exception)
        {
            _logger.LogError(
                exception,
                "Falha de consulta Oracle. TraceId: {TraceId}. Método: {Method}. Rota: {Path}",
                context.TraceIdentifier,
                context.Request.Method,
                context.Request.Path);
            await EscreverErroOracleAsync(context, exception);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Erro não tratado na API. TraceId: {TraceId}. Método: {Method}. Rota: {Path}",
                context.TraceIdentifier,
                context.Request.Method,
                context.Request.Path);

            if (context.Response.HasStarted)
                throw;

            // Algumas exceções do EF Core podem encapsular a OracleException
            // em outro tipo. Ainda assim, devolvemos o código Oracle quando ele
            // estiver presente em qualquer nível da cadeia de exceções.
            if (CodigoOracleRegex.IsMatch(exception.ToString()))
            {
                await EscreverErroOracleAsync(context, exception);
                return;
            }

            context.Response.Clear();
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new ApiErrorResponse(
                "ERRO_INTERNO",
                "Ocorreu um erro interno. Tente novamente ou contate o suporte informando o identificador da requisição.",
                null,
                DateTimeOffset.UtcNow,
                context.TraceIdentifier));
        }
    }

    private static IReadOnlyDictionary<string, string[]>? MapearErroPorCampo(
        Exception exception,
        string codigo,
        string mensagem)
    {
        var detalhe = exception.ToString().ToUpperInvariant();
        string? campo = null;
        if (detalhe.Contains("UQ_USUARIO_EMAIL")) campo = "Email";
        else if (detalhe.Contains("UQ_PONTO_CODIGO")) campo = "Codigo";
        else if (detalhe.Contains("UQ_LEITURA_EVENTO")) campo = "ChaveEvento";
        else if (detalhe.Contains("UQ_LEITURA_PONTO_DATA")) campo = "DataHoraLeitura";
        else if (detalhe.Contains("UQ_ALERTA_LEITURA")) campo = "IdLeitura";
        else if (detalhe.Contains("FK_LEITURA_PONTO")) campo = "IdPonto";
        else if (detalhe.Contains("FK_ALERTA_LEITURA")) campo = "IdLeitura";

        if (campo is null && (codigo is "ORA-01400" or "ORA-12899" or "ORA-01438" or "ORA-02290"))
            campo = "request";

        return campo is null
            ? null
            : new Dictionary<string, string[]> { [campo] = [mensagem] };
    }

    private static async Task EscreverErroOracleAsync(
        HttpContext context,
        Exception exception)
    {
        var match = CodigoOracleRegex.Match(exception.ToString());
        var codigo = match.Success ? match.Value.ToUpperInvariant() : "ORACLE_ERROR";

        var (status, mensagem) = codigo switch
        {
            "ORA-00001" => (StatusCodes.Status409Conflict,
                "Registro duplicado: um valor informado já está cadastrado."),
            "ORA-02291" => (StatusCodes.Status400BadRequest,
                "Referência inválida: o registro relacionado não foi encontrado."),
            "ORA-02292" => (StatusCodes.Status409Conflict,
                "Não é possível remover o registro porque existem registros dependentes."),
            "ORA-01400" => (StatusCodes.Status400BadRequest,
                "Um campo obrigatório não foi informado."),
            "ORA-12899" => (StatusCodes.Status400BadRequest,
                "Um dos campos excede o limite de tamanho permitido."),
            "ORA-01438" => (StatusCodes.Status400BadRequest,
                "Um valor numérico excede a precisão permitida."),
            "ORA-02290" => (StatusCodes.Status400BadRequest,
                "Um dos valores não atende às regras de integridade do banco."),
            "ORA-00904" => (StatusCodes.Status500InternalServerError,
                "A estrutura do banco Oracle não corresponde à versão da API: uma coluna esperada não foi encontrada. Execute o diagnóstico do schema Oracle do projeto."),
            _ => (StatusCodes.Status500InternalServerError,
                "O banco de dados não conseguiu concluir a operação. Verifique os dados ou contate o suporte.")
        };

        context.Response.Clear();
        context.Response.StatusCode = status;
        var erros = MapearErroPorCampo(exception, codigo, mensagem);
        await context.Response.WriteAsJsonAsync(new ApiErrorResponse(
            codigo,
            mensagem,
            erros,
            DateTimeOffset.UtcNow,
            context.TraceIdentifier));
    }
}
