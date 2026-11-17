namespace AlertaCidadao.Application.DTOs;

public sealed record OcorrenciaDto(
    long IdOcorrencia,
    long IdUsuario,
    string NomeUsuario,
    long? IdPonto,
    string? NomePonto,
    string Tipo,
    string Titulo,
    string Descricao,
    string? Logradouro,
    string? Bairro,
    string? Cidade,
    string? Uf,
    decimal? Latitude,
    decimal? Longitude,
    string Status,
    DateTimeOffset DataCriacao,
    DateTimeOffset? DataAtualizacao);
