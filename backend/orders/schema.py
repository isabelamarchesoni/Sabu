from drf_spectacular.utils import extend_schema, extend_schema_view

from core.schema import (
    ERRO_401, ERRO_403, ERRO_404, EX_VALIDACAO,
    crud_schema, exemplo_erro, resposta_erro,
)
from .serializers import ClienteSerializer, PedidoDetalhadoSerializer

TAG_CLIENTES = 'Clientes'
TAG_PEDIDOS = 'Pedidos'

cliente_schema = extend_schema_view(**crud_schema(
    TAG_CLIENTES, 'cliente', 'clientes',
    leitura=ClienteSerializer,
))

_EX_TRANSICAO = exemplo_erro(
    'transicao_status_invalida', 'Não é possível mudar o pedido de CANCELADO para CONCLUIDO.',
    {'atual': 'CANCELADO', 'novo': 'CONCLUIDO'})
_EX_ESTOQUE = exemplo_erro(
    'estoque_insuficiente',
    'Estoque insuficiente para "Sabonete" (SKU SAB-01). Saldo atual: 2, solicitado: 5.',
    {'variacao_id': 1, 'sku': 'SAB-01', 'produto': 'Sabonete', 'saldo': 2, 'solicitado': 5})
_EX_PEDIDO_NAO_EDITAVEL = exemplo_erro(
    'validation_error', 'Dados inválidos.',
    {'non_field_errors': ['Pedido concluído não pode mais ser alterado.']},
    nome='pedido_nao_editavel')
_EX_ITENS_VAZIO = exemplo_erro(
    'validation_error', 'Dados inválidos.',
    {'itens': ['O pedido deve conter pelo menos um item.']},
    nome='itens_vazio')
_EX_ITENS_REPETIDOS = exemplo_erro(
    'validation_error', 'Dados inválidos.',
    {'itens': ['Variações repetidas nos itens: [3]. Some as quantidades em um único item.']},
    nome='variacoes_repetidas')
_EX_CLIENTE_ID_INVALIDO = exemplo_erro(
    'validation_error', 'Dados inválidos.',
    {'cliente_id': ['Informe um número.']},
    nome='cliente_id_invalido')


def _acao(resumo, descricao):
    return extend_schema(
        tags=[TAG_PEDIDOS],
        summary=resumo,
        description=descricao,
        request=None,
        responses={
            200: PedidoDetalhadoSerializer,
            401: ERRO_401, 403: ERRO_403, 404: ERRO_404,
            409: resposta_erro('Transição de status inválida.', _EX_TRANSICAO),
        },
    )


pedido_schema = extend_schema_view(
    list=extend_schema(
        tags=[TAG_PEDIDOS], summary='Listar pedidos',
        description='Ordenados do mais recente para o mais antigo.',
        responses={
            200: PedidoDetalhadoSerializer,
            400: resposta_erro('Parâmetro de filtro inválido.', _EX_CLIENTE_ID_INVALIDO),
            401: ERRO_401, 403: ERRO_403,
        },
    ),
    retrieve=extend_schema(
        tags=[TAG_PEDIDOS], summary='Detalhar pedido',
        responses={200: PedidoDetalhadoSerializer, 401: ERRO_401, 403: ERRO_403, 404: ERRO_404},
    ),
    create=extend_schema(
        tags=[TAG_PEDIDOS], summary='Criar pedido',
        description='Baixa o estoque de cada item na criação. Tudo roda em uma transação: '
                    'se algum item não tiver saldo, nada é gravado. '
                    'Não pode haver variações repetidas entre os itens.',
        responses={
            201: PedidoDetalhadoSerializer,
            400: resposta_erro('Dados inválidos.', EX_VALIDACAO,
                               _EX_ITENS_VAZIO, _EX_ITENS_REPETIDOS),
            401: ERRO_401, 403: ERRO_403,
            409: resposta_erro('Estoque insuficiente.', _EX_ESTOQUE),
        },
    ),
    partial_update=extend_schema(
        tags=[TAG_PEDIDOS], summary='Atualizar pedido parcialmente',
        description='Altera apenas endereço e observação. O status não é alterado aqui '
                    '(use `concluir`, `cancelar` e `estornar`). '
                    'Pedidos fora dos status editáveis retornam 400.',
        responses={
            200: PedidoDetalhadoSerializer,
            400: resposta_erro('Dados inválidos ou pedido não editável.',
                               EX_VALIDACAO, _EX_PEDIDO_NAO_EDITAVEL),
            401: ERRO_401, 403: ERRO_403, 404: ERRO_404,
        },
    ),
    concluir=_acao('Concluir pedido', 'Muda o status para concluído. O estoque já foi baixado na criação.'),
    cancelar=_acao('Cancelar pedido (MOVIMENTA estoque automaticamente)', 'Cancela o pedido e devolve o estoque dos itens. Movimenta o estoque.'),
    estornar=_acao('Estornar pedido (NÃO movimenta estoque automaticamente)', 'Muda o status para estornado. Não movimenta o estoque.'),
)