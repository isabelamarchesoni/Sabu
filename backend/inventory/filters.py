from django_filters import rest_framework as df

from core.filters import ApagadasFilter
from .models import FichaTecnica, MovimentacaoEstoque


class FichaTecnicaFilter(df.FilterSet):
    variacao_id = df.NumberFilter(
        field_name="variacao_id",
        help_text="Filtra por variação.",
    )
    apagadas = ApagadasFilter(campo="apagada_em")

    class Meta:
        model = FichaTecnica
        fields = ["variacao_id", "apagadas"]


class MovimentacaoEstoqueFilter(df.FilterSet):
    variacao_id = df.NumberFilter(
        field_name="variacao_id",
        error_messages={"invalid": "Informe um ID numérico."},
        help_text="Filtra por variação.",
    )
    sku = df.CharFilter(
        method="filter_sku",
        help_text="Filtra pelo SKU da variação (ignora espaços e maiúsculas/minúsculas).",
    )

    class Meta:
        model = MovimentacaoEstoque
        fields = ["variacao_id", "sku"]

    def filter_sku(self, queryset, name, value):
        return queryset.filter(variacao__sku=value.strip().upper())