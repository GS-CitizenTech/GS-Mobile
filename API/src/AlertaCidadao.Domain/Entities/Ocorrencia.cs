namespace AlertaCidadao.Domain.Entities;

public class Ocorrencia
{
    public long IdOcorrencia { get; set; }

    public long? IdUsuario { get; set; }

    public long? IdPonto { get; set; }

    public string Tipo { get; set; } = string.Empty;

    public string Titulo { get; set; } = string.Empty;

    public string Descricao { get; set; } = string.Empty;

    public string? Logradouro { get; set; }

    public string? Bairro { get; set; }

    public string? Cidade { get; set; }

    public string? Uf { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public string Status { get; set; } = "ABERTA";

    public DateTimeOffset DataCriacao { get; set; }

    public DateTimeOffset? DataAtualizacao { get; set; }

    public Usuario? Usuario { get; set; }

    public PontoMonitoramento? Ponto { get; set; }
}
