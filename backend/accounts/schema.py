from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers

from core.schema import ERRO_400, ERRO_401, ERRO_403, exemplo_erro, resposta_erro

TAG = 'Autenticação'

_UsuarioResumo = inline_serializer('UsuarioResumo', fields={
    'id': serializers.IntegerField(),
    'nome': serializers.CharField(),
    'email': serializers.EmailField(),
    'cargo': serializers.CharField(),
})

_CadastroResposta = inline_serializer('CadastroUsuarioResposta', fields={
    'message': serializers.CharField(),
    'user': _UsuarioResumo,
})

_LoginResposta = inline_serializer('LoginResposta', fields={
    'access': serializers.CharField(help_text='JWT de acesso.'),
    'refresh': serializers.CharField(help_text='JWT de renovação.'),
    'id': serializers.IntegerField(help_text='ID do usuário autenticado.'),
    'nome': serializers.CharField(),
    'cargo': serializers.CharField(help_text='Ex.: "ADMIN".'),
})

token_schema = extend_schema(
    tags=[TAG],
    summary='Login (JWT)',
    description='Autentica e devolve o par access/refresh, com os dados básicos do usuário.',
    responses={
        200: _LoginResposta,
        400: ERRO_400,
        401: resposta_erro('Credenciais inválidas.', exemplo_erro(
            'authentication_failed', 'Nenhuma conta ativa encontrada com as credenciais fornecidas.')),
    },
)

cadastro_schema = extend_schema(
    tags=[TAG],
    summary='Cadastrar administrador',
    description='Restrito a administradores com `is_superuser`. Admin comum recebe 403.',
    responses={201: _CadastroResposta, 400: ERRO_400, 401: ERRO_401, 403: ERRO_403},
)