from rest_framework import serializers
from .models import Categoria, Produto, ProdutoVariacao, TipoPele


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nome']
        read_only_fields = ['id']

class TipoPeleSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoPele
        fields = ['id', 'nome']
        read_only_fields = ['id']


class ProdutoVariacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProdutoVariacao
        fields = [
            'id',
            'produto',
            'sku',
            'nome',
            'preco',
            'preco_promo',
            'inicio_promo',
            'fim_promo',
            'peso_gramas',
            'quantidade_estoque',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['quantidade_estoque'] = 0

        variacao = super().create(validated_data)
        return variacao

class ProdutoVariacaoUpdateSerializer(ProdutoVariacaoSerializer):
    class Meta(ProdutoVariacaoSerializer.Meta):
        read_only_fields = ['id', 'quantidade_estoque']


class ProdutoSerializer(serializers.ModelSerializer):
    # Aceita a lista de IDs de categorias no POST/PUT (ex: [1, 2])
    categorias = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all(),
        many=True,
        required=False
    )

    tipo_pele = serializers.PrimaryKeyRelatedField(
        queryset=TipoPele.objects.all(),
        many=True,
        required=False
    )

    class Meta:
        model = Produto
        fields = [
            'id',
            'nome',
            'descricao',
            'esta_ativo',
            'criado_em',
            'tipo_pele',
            'categorias',
        ]
        read_only_fields = ['id', 'criado_em']


class ProdutoDetalhadoSerializer(serializers.ModelSerializer):
    # Retorna o objeto completo das categorias e as variações atreladas ao produto
    categorias = CategoriaSerializer(many=True, read_only=True)
    variacoes = ProdutoVariacaoSerializer(many=True, read_only=True)
    tipo_pele = TipoPeleSerializer(many=True, read_only=True)

    class Meta:
        model = Produto
        fields = [
            'id',
            'nome',
            'descricao',
            'esta_ativo',
            'criado_em',
            'tipo_pele',
            'categorias',
            'variacoes',
        ]
        read_only_fields = ['id', 'criado_em']