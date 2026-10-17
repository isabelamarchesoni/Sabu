from django.db import transaction

from catalog.models import ProdutoVariacao
from .exceptions import (
    EstoqueInsuficiente,
    MovimentacaoIncoerente,
    TipoMovimentacaoInvalido,
)
from .models import (
    MovimentacaoEstoque,
    TIPOS_COM_PEDIDO,
    TIPOS_QUE_AUMENTAM,
    TIPOS_QUE_DIMINUEM,
)


@transaction.atomic
def registrar_movimentacao(*, variacao_id, tipo, quantidade, usuario,
                           pedido=None, observacao=None):
    if tipo in TIPOS_QUE_AUMENTAM:
        delta = quantidade
    elif tipo in TIPOS_QUE_DIMINUEM:
        delta = -quantidade
    else:
        raise TipoMovimentacaoInvalido(f'Tipo de movimentação inválido: {tipo}.')

    if (tipo in TIPOS_COM_PEDIDO) != (pedido is not None):
        raise MovimentacaoIncoerente(
            "Venda/estorno exigem pedido, os demais tipos não aceitam."
        )

    variacao = ProdutoVariacao.objects.select_for_update().get(pk=variacao_id)

    novo_saldo = variacao.quantidade_estoque + delta
    if novo_saldo < 0:
        raise EstoqueInsuficiente(
            variacao_id=variacao.pk,
            sku=variacao.sku,
            produto=variacao.nome,
            saldo=variacao.quantidade_estoque,
            solicitado=quantidade,
        )

    variacao.quantidade_estoque = novo_saldo
    variacao.save(update_fields=['quantidade_estoque'])

    return MovimentacaoEstoque.objects.create(
        variacao=variacao, tipo=tipo, quantidade_movimentada=quantidade,
        usuario=usuario, pedido=pedido, observacao=observacao,
    )