from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema, OpenApiParameter
from rest_framework import serializers

PARAM_APAGADAS = OpenApiParameter(
    name='apagadas',
    type=bool,
    location=OpenApiParameter.QUERY,
    required=False,
    description=(
        "Somente admin. Omitido: ativas e apagadas. "
        "`true`: só apagadas. `false`: só ativas."
    ),
)


class ErroSerializer(serializers.Serializer):
    code = serializers.CharField(help_text='Código estável do erro, ex.: "estoque_insuficiente".')
    detail = serializers.CharField(help_text='Mensagem legível.')
    errors = serializers.JSONField(
        allow_null=True,
        help_text='Erros por campo, lista de mensagens ou detalhes do erro de domínio. Null se não houver.',
    )


def exemplo_erro(code, detail, errors=None, nome=None):
    return OpenApiExample(nome or code, value={'code': code, 'detail': detail, 'errors': errors})


def resposta_erro(descricao, *exemplos):
    return OpenApiResponse(response=ErroSerializer, description=descricao, examples=list(exemplos))


EX_VALIDACAO = exemplo_erro('validation_error', 'Dados inválidos.', {'campo': ['Este campo é obrigatório.']})

ERRO_400 = resposta_erro('Informe um número.', EX_VALIDACAO)
ERRO_400_FILTRO = resposta_erro(
    'Filtro inválido.',
    exemplo_erro('validation_error', 'Dados inválidos.', {'apagadas': ['Informe true ou false.']}),
)
ERRO_401 = resposta_erro('Não autenticado.', exemplo_erro('not_authenticated', 'As credenciais de autenticação não foram fornecidas.'))
ERRO_403 = resposta_erro('Sem permissão.', exemplo_erro('permission_denied', 'Você não tem permissão para executar essa ação.'))
ERRO_404 = resposta_erro('Não encontrado.', exemplo_erro('not_found', 'Não encontrado.'))
ERRO_409_PROTEGIDO = resposta_erro(
    'Registro com vínculos.',
    exemplo_erro('registro_protegido', 'Este registro possui vínculos e não pode ser apagado.'),
)

OPS_CRUD = ('list', 'retrieve', 'create', 'update', 'partial_update', 'destroy')


def crud_schema(tag, singular, plural, *, leitura, escrita=None, atualizacao=None,
                leitura_publica=False, destroy_extra=None, list_extra=None, retrieve_extra=None,
                params=None, descricoes=None, ops=OPS_CRUD):
    escrita = escrita or leitura
    atualizacao = atualizacao or escrita
    params = params or {}
    descricoes = descricoes or {}
    list_extra = list_extra or {}
    retrieve_extra = retrieve_extra or {}
    auth = {401: ERRO_401, 403: ERRO_403}
    auth_leitura = {} if leitura_publica else auth
    if destroy_extra is None:
        destroy_extra = {409: ERRO_409_PROTEGIDO}

    atualizar = {200: atualizacao, 400: ERRO_400, **auth, 404: ERRO_404}
    definicoes = {
        'list': (f'Listar {plural}', {200: leitura, **auth_leitura, **list_extra}),
        'retrieve': (f'Detalhar {singular}', {200: leitura, **auth_leitura, 404: ERRO_404, **retrieve_extra}),
        'create': (f'Criar {singular}', {201: escrita, 400: ERRO_400, **auth}),
        'update': (f'Atualizar {singular}', atualizar),
        'partial_update': (f'Atualizar {singular} parcialmente', atualizar),
        'destroy': (f'Excluir {singular}', {204: None, **auth, 404: ERRO_404, **destroy_extra}),
    }
    return {
        op: extend_schema(
            tags=[tag], summary=resumo, description=descricoes.get(op),
            parameters=params.get(op, []), responses=resp,
        )
        for op, (resumo, resp) in definicoes.items() if op in ops
    }