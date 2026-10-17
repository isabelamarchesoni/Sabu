import re

from django_filters import rest_framework as df

from orders.models import Cliente, Pedido


class ClienteFilter(df.FilterSet):
    nome = df.CharFilter(
        lookup_expr="icontains",
        help_text="Busca parcial (contém), sem diferenciar maiúsculas.",
    )
    cpf_cnpj = df.CharFilter(
        method="filter_cpf_cnpj",
        help_text="Busca exata; pontuação é ignorada.",
    )

    class Meta:
        model = Cliente
        fields = ["nome", "cpf_cnpj"]

    def filter_cpf_cnpj(self, queryset, name, value):
        documento = re.sub(r"[^0-9A-Za-z]", "", value).upper()
        return queryset.filter(cpf_cnpj=documento)


class PedidoFilter(df.FilterSet):
    cliente_id = df.NumberFilter(
        field_name="cliente_id",
        help_text="Filtra por cliente (valor não numérico retorna 400).",
    )

    class Meta:
        model = Pedido
        fields = ["cliente_id"]