from drf_spectacular.utils import extend_schema, extend_schema_view

from core.schema import (
    ERRO_400, ERRO_400_FILTRO, ERRO_401, ERRO_403, ERRO_404, EX_VALIDACAO,
    crud_schema, exemplo_erro, resposta_erro, PARAM_APAGADAS,
)
from .serializers import (
    FichaTecnicaDetalhadaSerializer, FichaTecnicaSerializer, FichaTecnicaUpdateSerializer,
    MateriaPrimaSerializer, MovimentacaoEstoqueSerializer,
)

TAG = 'Estoque'

materia_prima_schema = extend_schema_view(**crud_schema(
    TAG, 'matéria-prima', 'matérias-primas', leitura=MateriaPrimaSerializer))

ficha_tecnica_schema = extend_schema_view(
    **crud_schema(
        TAG, 'ficha técnica', 'fichas técnicas',
        leitura=FichaTecnicaDetalhadaSerializer,
        escrita=FichaTecnicaSerializer,
        atualizacao=FichaTecnicaUpdateSerializer,
        destroy_extra={},
        params={'retrieve': [PARAM_APAGADAS]},
        list_extra={400: ERRO_400_FILTRO},
        retrieve_extra={400: ERRO_400_FILTRO},
        descricoes={
            'list': 'Sem `apagadas`, retorna ativas e apagadas. '
                    '`apagadas=true`: só apagadas; `apagadas=false`: só ativas.',
            'update': 'Só fichas ativas; fichas apagadas retornam 404 (restaure antes).',
            'partial_update': 'Só fichas ativas; fichas apagadas retornam 404 (restaure antes).',
            'destroy': 'Exclusão lógica. Ficha já apagada retorna 404.',
        },
    ),
    restaurar=extend_schema(
        tags=[TAG],
        summary='Restaurar ficha técnica',
        description='Desfaz a exclusão lógica. A variação precisa estar ativa (restaure-a antes).',
        request=None,
        responses={200: FichaTecnicaDetalhadaSerializer, 400: ERRO_400,
                   401: ERRO_401, 403: ERRO_403, 404: ERRO_404},
    ),
)

movimentacao_schema = extend_schema_view(
    **crud_schema(
        TAG, 'movimentação', 'movimentações',
        leitura=MovimentacaoEstoqueSerializer,
        list_extra={
            400: resposta_erro(
                'Filtro inválido.',
                exemplo_erro('validation_error', 'Dados inválidos.',
                             {'variacao_id': ['Informe um ID numérico.']}),
            ),
        },
        descricoes={'list': 'Ordenadas da mais recente para a mais antiga. '
                            'Os filtros `variacao_id` e `sku` podem ser combinados.'},
        ops=('list', 'retrieve'),
    ),
    create=extend_schema(
        tags=[TAG],
        summary='Registrar movimentação de estoque',
        description='Venda/estorno exigem pedido; os demais tipos não aceitam.',
        responses={
            201: MovimentacaoEstoqueSerializer,
            400: resposta_erro(
                'Dados inválidos ou movimentação incoerente.',
                EX_VALIDACAO,
                exemplo_erro('tipo_movimentacao_invalido', 'Tipo de movimentação inválido.'),
                exemplo_erro('movimentacao_incoerente',
                             'Venda/estorno exigem pedido, os demais tipos não aceitam.'),
            ),
            401: ERRO_401,
            403: ERRO_403,
            409: resposta_erro('Estoque insuficiente.', exemplo_erro(
                'estoque_insuficiente',
                'Estoque insuficiente para "Sabonete" (SKU SAB-01). Saldo atual: 2, solicitado: 5.',
                {'variacao_id': 1, 'sku': 'SAB-01', 'produto': 'Sabonete', 'saldo': 2, 'solicitado': 5},
            )),
        },
    ),
)