from decimal import Decimal

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
        fields = ['id', 'produto', 'sku', 'nome', 'preco', 'preco_promo',
                  'inicio_promo', 'fim_promo', 'peso_gramas',
                  'quantidade_estoque', 'apagado_em']
        read_only_fields = ['id', 'apagado_em', 'quantidade_estoque']
        extra_kwargs = {
            'preco': {'min_value': Decimal('0')},
            'preco_promo': {'min_value': Decimal('0')},
            'peso_gramas': {'min_value': 1},
        }

    def validate(self, attrs):
        def valor(campo):
            if campo in attrs:
                return attrs[campo]
            return getattr(self.instance, campo, None)

        preco = valor('preco')
        promo = valor('preco_promo')
        inicio = valor('inicio_promo')
        fim = valor('fim_promo')

        if promo is not None and preco is not None and promo >= preco:
            raise serializers.ValidationError(
                {'preco_promo': 'A promoção deve ser menor que o preço.'})

        if inicio is not None and fim is not None and inicio >= fim:
            raise serializers.ValidationError(
                {'fim_promo': 'O fim deve ser posterior ao início.'})

        if promo is not None and (inicio is None or fim is None):
            raise serializers.ValidationError(
                {'preco_promo': 'Informe o início e o fim da promoção.'})

        return attrs

class ProdutoVariacaoUpdateSerializer(ProdutoVariacaoSerializer):
    class Meta(ProdutoVariacaoSerializer.Meta):
        read_only_fields = ['id', 'apagado_em', 'quantidade_estoque']


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