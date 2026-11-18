using System.ComponentModel.DataAnnotations;

namespace AlertaCidadao.Application.DTOs;

public sealed record CriarSolicitacaoGestorRequest
{
    [Required(ErrorMessage = "O motivo da solicitação é obrigatório.")]
    [StringLength(500, MinimumLength = 10, ErrorMessage = "Descreva o motivo em 10 a 500 caracteres.")]
    public string Motivo { get; init; } = string.Empty;
}
