from decimal import Decimal

from rest_framework import serializers

from core.mixins import VariacaoPorIdOuSkuMixin
from .models import MateriaPrima, FichaTecnica, MovimentacaoEstoque, TIPOS_COM_PEDIDO
from .services import registrar_movimentacao


class MateriaPrimaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MateriaPrima
        fields = [
            'id',
            'nome',
            'unidade_medida',
            'quantidade_estoque',
            'valor_custo_unitario',
        ]
        read_only_fields = ['id']


class FichaTecnicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FichaTecnica
        fields = ['id', 'variacao', 'materia_prima', 'quantidade_necessaria', 'apagada_em']
        read_only_fields = ['id', 'apagada_em']
        extra_kwargs = {
            'quantidade_necessaria': {'min_value': Decimal('0.001')}
        }


class FichaTecnicaDetalhadaSerializer(FichaTecnicaSerializer):
    materia_prima = MateriaPrimaSerializer(read_only=True)

    class Meta(FichaTecnicaSerializer.Meta):
        pass

class FichaTecnicaUpdateSerializer(FichaTecnicaSerializer):
    class Meta(FichaTecnicaSerializer.Meta):
        read_only_fields = ['id', 'variacao', 'apagada_em']


class SkuRelatedField(serializers.SlugRelatedField):
    def to_internal_value(self, data):
        if isinstance(data, str):
            data = data.strip().upper()
        return super().to_internal_value(data)


class MovimentacaoEstoqueSerializer(VariacaoPorIdOuSkuMixin, serializers.ModelSerializer):
    class Meta:
        model = MovimentacaoEstoque
        fields = [
            'id',
            'variacao',
            'sku',
            'variacao_nome',
            'produto_nome',
            'usuario',
            'pedido',
            'tipo',
            'quantidade_movimentada',
            'observacao',
            'movimentado_em',
        ]
        read_only_fields = ['id', 'usuario', 'pedido', 'movimentado_em']
        extra_kwargs = {
            'quantidade_movimentada': {'min_value': 1, 'max_value': 100000}
        }

    def validate_tipo(self, value):
        if value in TIPOS_COM_PEDIDO:
            raise serializers.ValidationError('Este tipo é gerado automaticamente pelo pedido.')
        return value

    def create(self, validated_data):
        return registrar_movimentacao(
            variacao_id=validated_data['variacao'].pk,
            tipo=validated_data['tipo'],
            quantidade=validated_data['quantidade_movimentada'],
            usuario=self.context['request'].user,
            observacao=validated_data.get('observacao'),
        )