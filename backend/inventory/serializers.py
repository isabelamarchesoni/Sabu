from rest_framework import serializers
from .models import MateriaPrima, FichaTecnica, MovimentacaoEstoque


class MateriaPrimaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MateriaPrima
        fields = [
            'id_materia_prima',
            'nm_materia_prima',
            'sg_unidade_medida',
            'qtd_estoque',
            'vl_custo_unitario',
        ]
        read_only_fields = ['id_materia_prima']


class FichaTecnicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FichaTecnica
        fields = ['id_ficha', 'id_variacao', 'id_materia_prima', 'qtd_necessaria']

    def validate_qtd_necessaria(self, value):
        if value <= 0:
            raise serializers.ValidationError("A quantidade necessária deve ser maior que zero.")
        return value


class FichaTecnicaDetalhadaSerializer(serializers.ModelSerializer):
    materia_prima = MateriaPrimaSerializer(source='id_materia_prima', read_only=True)

    class Meta:
        model = FichaTecnica
        fields = ['id_ficha' ,'id_variacao', 'id_materia_prima', 'materia_prima', 'qtd_necessaria']
        read_only_fields = ['id_ficha']


class MovimentacaoEstoqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimentacaoEstoque
        fields = [
            'id_movimentacao',
            'id_variacao',
            'id_usuario_responsavel',
            'id_pedido',
            'tp_movimentacao',
            'qtd_movimentacao',
            'ds_observacao',
            'dt_movimentacao',
        ]
        read_only_fields = ['id_movimentacao', 'id_usuario_responsavel', 'id_pedido', 'dt_movimentacao']

    def validate_qtd_movimentacao(self, value):
        if value <= 0:
            raise serializers.ValidationError("A quantidade da movimentação deve ser maior que zero.")
        return value

    def create(self, validated_data):
        # Cria o registro de movimentação no banco
        movimentacao = super().create(validated_data)
        variacao = movimentacao.id_variacao

        # Atualiza a quantidade do estoque da ProdutoVariacao vinculada
        if movimentacao.tp_movimentacao == 'ENTRADA':
            variacao.qtd_estoque += movimentacao.qtd_movimentacao
        elif movimentacao.tp_movimentacao in ['SAIDA_VENDA', 'AJUSTE_PERDA']:
            # Garante que o estoque não fique negativo involuntariamente
            if variacao.qtd_estoque < movimentacao.qtd_movimentacao:
                raise serializers.ValidationError({
                    "qtd_movimentacao": f"Estoque insuficiente. Saldo atual: {variacao.qtd_estoque}"
                })
            variacao.qtd_estoque -= movimentacao.qtd_movimentacao

        variacao.save()
        return movimentacao