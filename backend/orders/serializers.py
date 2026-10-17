import re
from collections import Counter

from rest_framework import serializers
from validate_docbr import CPF, CNPJ

from core.mixins import ValidaEnderecoMixin, VariacaoPorIdOuSkuMixin
from orders.models import Pedido, PedidoItem, Cliente, StatusPedido
from orders.services import criar_pedido_completo

STATUS_EDITAVEIS = {StatusPedido.PENDENTE}

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['id', 'nome', 'telefone', 'cpf_cnpj', 'ultimo_pedido_em', 'criado_em']
        read_only_fields = ['ultimo_pedido_em', 'criado_em']

    def validate_nome(self, value):
        if not re.match(r'^[a-zA-Za-fA-Fà-úÀ-ÚçÇ\s]+$', value):
            raise serializers.ValidationError("O nome não pode conter números ou caracteres especiais.")

        return value

    def validate_cpf_cnpj(self, value):
        if not value:
            return None

        limpo = re.sub(r'[^0-9A-Za-z]', '', value).upper()

        if len(limpo) == 11:
            if not limpo.isdigit() or not CPF().validate(limpo):
                raise serializers.ValidationError('CPF inválido.')
        elif len(limpo) == 14:
            if not CNPJ().validate(limpo):
                raise serializers.ValidationError('CNPJ inválido.')
        else:
            raise serializers.ValidationError(
                'Informe um CPF (11 caracteres) ou um CNPJ (14 caracteres).'
            )

        return limpo


class PedidoItemSerializer(VariacaoPorIdOuSkuMixin, serializers.ModelSerializer):
    class Meta:
        model = PedidoItem
        fields = [
            'id',
            'variacao',
            'quantidade_item',
            'valor_unitario',
        ]
        read_only_fields = ['valor_unitario']
        extra_kwargs = {
            'quantidade_item': {'min_value': 1, 'max_value': 1000},
        }


class PedidoDetalhadoSerializer(ValidaEnderecoMixin, serializers.ModelSerializer):
    itens = PedidoItemSerializer(many=True, read_only=True, source='pedido_itens')

    class Meta:
        model = Pedido
        fields = [
            'id',
            'cliente',
            'cep',
            'numero_residencia',
            'logradouro',
            'complemento',
            'bairro',
            'cidade',
            'sigla_estado',
            'status',
            'valor_total',
            'observacao',
            'criado_em',
            'atualizado_em',
            'itens',
        ]
        read_only_fields = ['status', 'valor_total', 'criado_em', 'atualizado_em']


class PedidoCreateSerializer(PedidoDetalhadoSerializer):
    itens = PedidoItemSerializer(many=True, write_only=True)

    def validate_itens(self, value):
        if not value:
            raise serializers.ValidationError('O pedido deve conter pelo menos um item.')

        contagem = Counter(item['variacao'] for item in value)
        repetidas = sorted(v.sku for v, qtd in contagem.items() if qtd > 1)

        if repetidas:
            raise serializers.ValidationError(
                f'Variações repetidas nos itens: {", ".join(repetidas)}. '
                'Some as quantidades em um único item.'
            )

        return value

    def create(self, validated_data):
        itens_data = validated_data.pop('itens')

        return criar_pedido_completo(
            usuario=self.context['request'].user,
            dados_pedido=validated_data,
            itens_data=itens_data,
        )

    def to_representation(self, instance):
        return PedidoDetalhadoSerializer(instance, context=self.context).data


class PedidoUpdateSerializer(ValidaEnderecoMixin, serializers.ModelSerializer):
    class Meta:
        model = Pedido
        fields = [
            'cep',
            'logradouro',
            'numero_residencia',
            'complemento',
            'bairro',
            'cidade',
            'sigla_estado',
            'observacao',
        ]

    def validate(self, attrs):
        if self.instance.status not in STATUS_EDITAVEIS:
            raise serializers.ValidationError(
                f'Pedido {self.instance.get_status_display().lower()} não pode mais ser alterado.'
            )
        return super().validate(attrs)

    def update(self, instance, validated_data):
        for campo, valor in validated_data.items():
            setattr(instance, campo, valor)
        instance.save(update_fields=[*validated_data.keys(), 'atualizado_em'])
        return instance

    def to_representation(self, instance):
        return PedidoDetalhadoSerializer(instance, context=self.context).data