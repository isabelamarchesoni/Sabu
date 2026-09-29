from rest_framework import serializers
from .models import MateriaPrima, FichaTecnica, MovimentacaoEstoque


class MateriaPrimaSerializer(serializers.ModelSerializer):
    class Meta:
        model = MateriaPrima
        fields = [
            'id_materia_prima',
            'nm_materia_prima',
            'unidade_medida',
            'qtd_estoque',
            'custo_unitario',
        ]


class FichaTecnicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FichaTecnica
        fields = ['id_variacao', 'id_materia_prima', 'qtd_necessaria']

    def validate_qtd_necessaria(self, value):
        if value <= 0:
            raise serializers.ValidationError("A quantidade necessária deve ser maior que zero.")
        return value


class FichaTecnicaDetalhadaSerializer(serializers.ModelSerializer):
    materia_prima = MateriaPrimaSerializer(source='id_materia_prima', read_only=True)

    class Meta:
        model = FichaTecnica
        fields = ['id_variacao', 'id_materia_prima', 'materia_prima', 'qtd_necessaria']


class MovimentacaoEstoqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimentacaoEstoque
        fields = [
            'id_movimentacao',
            'id_variacao',
            'tipo_movimentacao',
            'qtd_movimentacao',
            'ds_observacao',
            'dt_movimentacao',
        ]
        read_only_fields = ['dt_movimentacao']

    def validate_qtd_movimentacao(self, value):
        if value <= 0:
            raise serializers.ValidationError("A quantidade da movimentação deve ser maior que zero.")
        return value

    def create(self, validated_data):
        # Cria o registro de movimentação no banco
        movimentacao = super().create(validated_data)
        variacao = movimentacao.id_variacao

        # Atualiza a quantidade do estoque da ProdutoVariacao vinculada
        if movimentacao.tipo_movimentacao == 'ENTRADA':
            variacao.qtd_estoque_produto += movimentacao.qtd_movimentacao
        elif movimentacao.tipo_movimentacao in ['SAIDA_VENDA', 'AJUSTE_PERDA']:
            # Garante que o estoque não fique negativo involuntariamente
            if variacao.qtd_estoque_produto < movimentacao.qtd_movimentacao:
                raise serializers.ValidationError({
                    "qtd_movimentacao": f"Estoque insuficiente. Saldo atual: {variacao.qtd_estoque_produto}"
                })
            variacao.qtd_estoque_produto -= movimentacao.qtd_movimentacao

        variacao.save()
        return movimentacao
