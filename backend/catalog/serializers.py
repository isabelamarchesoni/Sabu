from rest_framework import serializers
from .models import Categoria, Produto, ProdutoCategoria, ProdutoVariacao


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id_categoria', 'nm_categoria']
        read_only_fields = ['id_categoria']


class ProdutoVariacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProdutoVariacao
        fields = [
            'id_variacao',
            'id_produto',
            'cd_sku',
            'nm_variacao',
            'vl_preco',
            'vl_preco_promo',
            'dt_inicio_promo',
            'dt_fim_promo',
            'ps_gramas',
            'qtd_estoque',
        ]
        read_only_fields = ['id_variacao']


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
            'tp_pele',
            'fl_ativo',
            'dt_criacao',
            'categorias',
        ]
        read_only_fields = ['id_produto', 'dt_criacao']


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
            'tp_pele',
            'fl_ativo',
            'dt_criacao',
            'categorias',
            'variacoes',
        ]
        read_only_fields = ['id_produto', 'dt_criacao']