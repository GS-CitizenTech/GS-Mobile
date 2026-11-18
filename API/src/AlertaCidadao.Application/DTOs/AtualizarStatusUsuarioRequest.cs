using System.ComponentModel.DataAnnotations;

namespace AlertaCidadao.Application.DTOs;

/// <summary>Solicita a ativação ou desativação administrativa de uma conta.</summary>
public sealed record AtualizarStatusUsuarioRequest
{
    public bool Ativo { get; init; }
}
