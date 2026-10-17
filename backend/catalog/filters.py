from django_filters import rest_framework as df

from core.filters import ApagadasFilter, BooleanoEstritoFilter
from .models import Produto, ProdutoVariacao


class ProdutoFilter(df.FilterSet):
    categoria_id = df.NumberFilter(
        field_name="categorias__id",
        distinct=True,
        help_text="Filtra produtos por categoria.",
    )
    tipo_pele_id = df.NumberFilter(
        field_name="tipo_pele__id",
        distinct=True,
        help_text="Filtra produtos por tipo de pele.",
    )

    class Meta:
        model = Produto
        fields = ["categoria_id", "tipo_pele_id"]


class ProdutoVariacaoFilter(df.FilterSet):
    produto_id = df.NumberFilter(
        field_name="produto_id",
        help_text="Filtra variações por produto.",
    )
    produto_ativo = BooleanoEstritoFilter(
        field_name="produto__esta_ativo",
        help_text=(
            "Filtra pelo status do produto vinculado. `true`: só variações de produtos ativos. "
            "`false`: só variações de produtos desativados. Omitido: todas."
        ),
    )
    apagadas = ApagadasFilter(
        campo="apagado_em",
        somente_admin=True,
        help_text="Somente admin. Omitido: ativas e apagadas. `true`: só apagadas. `false`: só ativas.",
    )

    class Meta:
        model = ProdutoVariacao
        fields = ["produto_id", "produto_ativo", "apagadas"]