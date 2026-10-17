from rest_framework import serializers

from catalog.models import ProdutoVariacao

from collections.abc import Mapping

CAMPOS_ENDERECO_OBRIGATORIOS = [
    'cep', 'logradouro', 'numero_residencia', 'bairro', 'cidade', 'sigla_estado',
]

class ValidaEnderecoMixin:
    def validate(self, attrs):
        def valor(campo):
            if campo in attrs:
                return attrs[campo]
            return getattr(self.instance, campo, '') if self.instance else ''

        campos = [*CAMPOS_ENDERECO_OBRIGATORIOS, 'complemento']
        if any(valor(c) for c in campos):
            faltando = {
                c: 'Obrigatório quando o endereço é informado.'
                for c in CAMPOS_ENDERECO_OBRIGATORIOS
                if not valor(c)
            }
            if faltando:
                raise serializers.ValidationError(faltando)
        return attrs


class SkuRelatedField(serializers.SlugRelatedField):
    def to_internal_value(self, data):
        if isinstance(data, str):
            data = data.strip().upper()
        return super().to_internal_value(data)


class VariacaoPorIdOuSkuMixin(serializers.Serializer):
    variacao = serializers.PrimaryKeyRelatedField(
        queryset=ProdutoVariacao.objects.all(), required=False
    )
    sku = SkuRelatedField(
        slug_field='sku',
        source='variacao',
        queryset=ProdutoVariacao.objects.all(),
        required=False,
    )

    variacao_nome = serializers.CharField(source='variacao.nome', read_only=True)
    produto_nome = serializers.CharField(source='variacao.produto.nome', read_only=True)

    def to_internal_value(self, data):
        if isinstance(data, Mapping):
            if 'variacao' in data and 'sku' in data:
                raise serializers.ValidationError(
                    {'sku': "Informe apenas 'variacao' (ID) ou 'sku', não ambos."}
                )
            if 'variacao' not in data and 'sku' not in data:
                raise serializers.ValidationError(
                    {'variacao': "Informe 'variacao' (ID) ou 'sku'."}
                )
        return super().to_internal_value(data)


class FiltrosSomenteNaLeituraMixin:
    def filter_queryset(self, queryset):
        if self.action not in ('list', 'retrieve'):
            return queryset
        return super().filter_queryset(queryset)