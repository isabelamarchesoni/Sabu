from drf_spectacular.utils import extend_schema, extend_schema_view

from core.schema import (
    ERRO_400, ERRO_400_FILTRO, ERRO_401, ERRO_403, ERRO_404, crud_schema,
    exemplo_erro, resposta_erro, PARAM_APAGADAS,
)
from .serializers import (
    CategoriaSerializer, ProdutoDetalhadoSerializer, ProdutoSerializer,
    ProdutoVariacaoSerializer, ProdutoVariacaoUpdateSerializer, TipoPeleSerializer,
)

TAG = 'Catálogo'

categoria_schema = extend_schema_view(**crud_schema(
    TAG, 'categoria', 'categorias', leitura=CategoriaSerializer, leitura_publica=True))

tipo_pele_schema = extend_schema_view(**crud_schema(
    TAG, 'tipo de pele', 'tipos de pele', leitura=TipoPeleSerializer, leitura_publica=True))

produto_schema = extend_schema_view(**crud_schema(
    TAG, 'produto', 'produtos',
    leitura=ProdutoDetalhadoSerializer, escrita=ProdutoSerializer,
    leitura_publica=True,
    # list: parâmetros gerados pelo ProdutoFilter
    list_extra={
        400: resposta_erro(
            'Filtro inválido.',
            exemplo_erro('validation_error', 'Dados inválidos.',
                         {'categoria_id': ['Informe um número.']}),
        ),
    },
    descricoes={'list': 'Não-admin vê apenas produtos ativos.'},
))

variacao_schema = extend_schema_view(
    **crud_schema(
        TAG, 'variação', 'variações',
        leitura=ProdutoVariacaoSerializer, escrita=ProdutoVariacaoUpdateSerializer,
        leitura_publica=True,
        destroy_extra={},
        params={'retrieve': [PARAM_APAGADAS]},
        list_extra={
            400: resposta_erro(
                'Filtro inválido.',
                exemplo_erro('validation_error', 'Dados inválidos.',
                             {'apagadas': ['Informe true ou false.']}, nome='apagadas_invalido'),
                exemplo_erro('validation_error', 'Dados inválidos.',
                             {'produto_id': ['Informe um número.']}, nome='produto_id_invalido'),
            ),
        },
        retrieve_extra={400: ERRO_400_FILTRO},
        descricoes={
            'list': 'Não-admin vê apenas variações ativas de produtos ativos e `apagadas` é ignorado. '
                    'Admin: sem `apagadas`, retorna ativas e apagadas.',
            'destroy': 'Exclusão lógica. Apaga também as fichas técnicas ativas da variação. '
                       'Variação já apagada retorna 404.',
        },
    ),
    restaurar=extend_schema(
        tags=[TAG],
        summary='Restaurar variação',
        description='Desfaz a exclusão lógica e restaura as fichas técnicas apagadas junto com ela.',
        request=None,
        responses={200: ProdutoVariacaoSerializer, 400: ERRO_400,
                   401: ERRO_401, 403: ERRO_403, 404: ERRO_404},
    ),
)