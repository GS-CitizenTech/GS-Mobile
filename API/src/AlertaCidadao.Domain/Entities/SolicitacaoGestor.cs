namespace AlertaCidadao.Domain.Entities;

public sealed class SolicitacaoGestor
{
    public long IdSolicitacaoGestor { get; set; }
    public long IdUsuario { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDENTE";
    public DateTimeOffset DataSolicitacao { get; set; }
    public DateTimeOffset? DataDecisao { get; set; }
    public long? IdGestorResponsavel { get; set; }
    public string? ObservacaoDecisao { get; set; }
}
