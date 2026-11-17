using System.ComponentModel.DataAnnotations;

namespace AlertaCidadao.Application.DTOs;

public abstract class OcorrenciaRequestBase
{
    [Required(ErrorMessage = "Informe o tipo da ocorrência.")]
    [StringLength(30, ErrorMessage = "O tipo deve ter até 30 caracteres.")]
    public string Tipo { get; set; } = string.Empty;

    [Required(ErrorMessage = "Informe um título.")]
    [StringLength(120, MinimumLength = 5, ErrorMessage = "O título deve ter entre 5 e 120 caracteres.")]
    public string Titulo { get; set; } = string.Empty;

    [Required(ErrorMessage = "Descreva a ocorrência.")]
    [StringLength(1000, MinimumLength = 10, ErrorMessage = "A descrição deve ter entre 10 e 1000 caracteres.")]
    public string Descricao { get; set; } = string.Empty;

    [Range(typeof(long), "1", "9223372036854775807", ErrorMessage = "O ponto de monitoramento informado é inválido.")]
    public long? IdPonto { get; set; }

    [StringLength(180)]
    public string? Logradouro { get; set; }

    [StringLength(100)]
    public string? Bairro { get; set; }

    [StringLength(100)]
    public string? Cidade { get; set; }

    [StringLength(2, MinimumLength = 2, ErrorMessage = "A UF deve conter exatamente 2 caracteres.")]
    public string? Uf { get; set; }

    [Range(typeof(decimal), "-90", "90", ErrorMessage = "A latitude deve estar entre -90 e 90.")]
    public decimal? Latitude { get; set; }

    [Range(typeof(decimal), "-180", "180", ErrorMessage = "A longitude deve estar entre -180 e 180.")]
    public decimal? Longitude { get; set; }
}
