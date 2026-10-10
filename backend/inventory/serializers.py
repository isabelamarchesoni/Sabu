from rest_framework import serializers
from .models import MateriaPrima, FichaTecnica, MovimentacaoEstoque


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
        fields = ['id', 'variacao', 'materia_prima', 'quantidade_necessaria']
        read_only_fields = ['id']

    def validate_quantidade_necessaria(self, value):
        if value <= 0:
            raise serializers.ValidationError("A quantidade necessária deve ser maior que zero.")
        return value


class FichaTecnicaDetalhadaSerializer(FichaTecnicaSerializer):
    materia_prima = MateriaPrimaSerializer(read_only=True)

    class Meta(FichaTecnicaSerializer.Meta):
        pass

class FichaTecnicaUpdateSerializer(FichaTecnicaSerializer):
    class Meta(FichaTecnicaSerializer.Meta):
        read_only_fields = ['id', 'variacao']


class MovimentacaoEstoqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimentacaoEstoque
        fields = [
            'id',
            'variacao',
            'usuario',
            'pedido',
            'tipo',
            'quantidade_movimentada',
            'observacao',
            'movimentado_em',
        ]
        read_only_fields = ['id', 'usuario', 'pedido', 'movimentado_em']

    def validate_quantidade_movimentada(self, value):
        if value <= 0:
            raise serializers.ValidationError("A quantidade da movimentação deve ser maior que zero.")
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        usuario = request.user

        validated_data['usuario'] = usuario

        # Cria o registro de movimentação no banco
        movimentacao = super().create(validated_data)
        variacao = movimentacao.variacao

        # Atualiza a quantidade do estoque da ProdutoVariacao vinculada
        if movimentacao.tipo == 'ENTRADA':
            variacao.quantidade_estoque += movimentacao.quantidade_movimentada
        elif movimentacao.tipo in ['SAIDA_VENDA', 'AJUSTE_PERDA']:
            # Garante que o estoque não fique negativo involuntariamente
            if variacao.quantidade_estoque < movimentacao.quantidade_movimentada:
                raise serializers.ValidationError({
                    "quantidade_movimentada": f"Estoque insuficiente. Saldo atual: {variacao.quantidade_estoque}"
                })
            variacao.quantidade_estoque -= movimentacao.quantidade_movimentada

        variacao.save()
        return movimentacao