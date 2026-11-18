using System.ComponentModel.DataAnnotations;

namespace AlertaCidadao.Application.DTOs;

public sealed record DecidirSolicitacaoGestorRequest
{
    [Required(ErrorMessage = "A decisão é obrigatória.")]
    [RegularExpression("^(?i:APROVADA|REJEITADA)$", ErrorMessage = "A decisão deve ser APROVADA ou REJEITADA.")]
    public string Status { get; init; } = string.Empty;

    [StringLength(500, ErrorMessage = "A observação deve ter no máximo 500 caracteres.")]
    public string? Observacao { get; init; }
}
