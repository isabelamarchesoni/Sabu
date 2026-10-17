from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.mixins import PublicReadAdminWriteViewSetMixin
from accounts.utils import usuario_e_admin
from core.exceptions import ErroDeDominio
from core.mixins import FiltrosSomenteNaLeituraMixin
from inventory.models import FichaTecnica
from .filters import ProdutoFilter, ProdutoVariacaoFilter
from .models import Categoria, Produto, ProdutoVariacao, TipoPele
from .schema import categoria_schema, tipo_pele_schema, produto_schema, variacao_schema
from .serializers import (
    CategoriaSerializer,
    ProdutoSerializer,
    ProdutoDetalhadoSerializer,
    ProdutoVariacaoSerializer,
    ProdutoVariacaoUpdateSerializer,
    TipoPeleSerializer,
)


@categoria_schema
class CategoriaViewSet(PublicReadAdminWriteViewSetMixin, viewsets.ModelViewSet):
    queryset = Categoria.objects.order_by('nome')
    serializer_class = CategoriaSerializer


@tipo_pele_schema
class TipoPeleViewSet(PublicReadAdminWriteViewSetMixin, viewsets.ModelViewSet):
    queryset = TipoPele.objects.order_by('nome')
    serializer_class = TipoPeleSerializer


@produto_schema
class ProdutoViewSet(PublicReadAdminWriteViewSetMixin, viewsets.ModelViewSet):
    queryset = (
        Produto.objects
        .prefetch_related('categorias', 'variacoes', 'tipo_pele')
        .order_by('nome')
    )
    filterset_class = ProdutoFilter

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProdutoDetalhadoSerializer
        return ProdutoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if not usuario_e_admin(self.request.user):
            qs = qs.filter(esta_ativo=True)
        return qs


@variacao_schema
class ProdutoVariacaoViewSet(PublicReadAdminWriteViewSetMixin, FiltrosSomenteNaLeituraMixin,
                             viewsets.ModelViewSet):
    queryset = ProdutoVariacao.objects.select_related('produto')
    filterset_class = ProdutoVariacaoFilter

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProdutoVariacaoSerializer
        return ProdutoVariacaoUpdateSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        if not usuario_e_admin(self.request.user):
            return qs.filter(apagado_em__isnull=True, produto__esta_ativo=True)

        # Admin: list/retrieve dependem do filtro `apagadas`; restaurar enxerga tudo;
        # update/destroy só valem nas variações ativas.
        if self.action not in ('list', 'retrieve', 'restaurar'):
            qs = qs.filter(apagado_em__isnull=True)
        return qs

    def perform_destroy(self, instance):
        with transaction.atomic():
            timestamp = timezone.now()
            instance.apagado_em = timestamp
            instance.save(update_fields=['apagado_em'])

            FichaTecnica.objects.filter(
                variacao_id=instance.pk,
                apagada_em__isnull=True,
            ).update(apagada_em=timestamp)

    @action(detail=True, methods=['patch'], url_path='restaurar')
    def restaurar(self, request, pk=None):
        variacao = self.get_object()

        if not variacao.apagado_em:
            raise ErroDeDominio('Esta variação não está apagada.')

        with transaction.atomic():
            timestamp_exclusao = variacao.apagado_em

            variacao.apagado_em = None
            variacao.save(update_fields=['apagado_em'])

            FichaTecnica.objects.filter(
                variacao_id=variacao.pk,
                apagada_em=timestamp_exclusao,
            ).update(apagada_em=None)

        return Response(ProdutoVariacaoSerializer(variacao).data, status=status.HTTP_200_OK)