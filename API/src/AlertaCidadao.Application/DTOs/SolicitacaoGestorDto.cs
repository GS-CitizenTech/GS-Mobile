namespace AlertaCidadao.Application.DTOs;

public sealed record SolicitacaoGestorDto(
    long IdSolicitacaoGestor,
    long IdUsuario,
    string NomeUsuario,
    string EmailUsuario,
    string? TelefoneUsuario,
    string Motivo,
    string Status,
    DateTimeOffset DataSolicitacao,
    DateTimeOffset? DataDecisao,
    long? IdGestorResponsavel,
    string? ObservacaoDecisao);
