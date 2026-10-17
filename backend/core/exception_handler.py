from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import ProtectedError
from django.http import Http404
from rest_framework import exceptions as drf_exc
from rest_framework.response import Response
from rest_framework.views import exception_handler, set_rollback

from .exceptions import ErroDeDominio


def _resposta(status, code, detail, errors=None):
    set_rollback()
    return Response(
        {'code': code, 'detail': detail, 'errors': errors},
        status=status,
    )


def custom_exception_handler(exc, context):
    if isinstance(exc, ErroDeDominio):
        return _resposta(exc.status_code, exc.codigo, exc.mensagem, exc.detalhes or None)

    if isinstance(exc, Http404):
        return _resposta(404, 'not_found', 'Não encontrado.')

    if isinstance(exc, DjangoValidationError):
        errors = exc.message_dict if hasattr(exc, 'error_dict') else exc.messages
        return _resposta(400, 'validation_error', 'Dados inválidos.', errors)

    if isinstance(exc, ProtectedError):
        return _resposta(
            409, 'registro_protegido',
            'Este registro possui vínculos e não pode ser apagado.',
        )

    response = exception_handler(exc, context)
    if response is None:
        return None

    if isinstance(exc, drf_exc.ValidationError):
        response.data = {
            'code': 'validation_error',
            'detail': 'Dados inválidos.',
            'errors': response.data,
        }
    else:
        response.data = {
            'code': getattr(exc, 'default_code', 'error'),
            'detail': response.data.get('detail', 'Erro.') if isinstance(response.data, dict) else 'Erro.',
            'errors': None,
        }
    return response