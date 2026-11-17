using System.ComponentModel.DataAnnotations;

namespace AlertaCidadao.Application.DTOs;

public sealed class AtualizarOcorrenciaRequest : OcorrenciaRequestBase
{
    [StringLength(20, ErrorMessage = "O status deve ter até 20 caracteres.")]
    public string? Status { get; set; }
}
