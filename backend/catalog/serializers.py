from rest_framework import serializers
from .models import Categoria, Produto, ProdutoCategoria, ProdutoVariacao


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id_categoria', 'nm_categoria']


class ProdutoVariacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProdutoVariacao
        fields = [
            'id_variacao',
            'id_produto',
            'sku_produto',
            'nm_variacao',
            'vl_produto',
            'vl_promo_produto',
            'dt_inicio_promo_produto',
            'dt_fim_promo_produto',
            'peso_gramas_produto',
            'qtd_estoque_produto',
        ]


class ProdutoSerializer(serializers.ModelSerializer):
    # Aceita a lista de IDs de categorias no POST/PUT (ex: [1, 2])
    categorias = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = Produto
        fields = [
            'id_produto',
            'nm_produto',
            'ds_produto',
            'tipo_pele_produto',
            'produto_ativo',
            'dt_criacao',
            'categorias',
        ]
        read_only_fields = ['dt_criacao']


class ProdutoDetalhadoSerializer(serializers.ModelSerializer):
    # Retorna o objeto completo das categorias e as variações atreladas ao produto
    categorias = CategoriaSerializer(many=True, read_only=True)
    variacoes = ProdutoVariacaoSerializer(many=True, read_only=True)

    class Meta:
        model = Produto
        fields = [
            'id_produto',
            'nm_produto',
            'ds_produto',
            'tipo_pele_produto',
            'produto_ativo',
            'dt_criacao',
            'categorias',
            'variacoes',
        ]
