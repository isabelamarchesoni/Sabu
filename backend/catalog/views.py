from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.mixins import PublicReadAdminWriteViewSetMixin
from .models import Categoria, Produto, ProdutoVariacao, TipoPele
from .serializers import (
    CategoriaSerializer,
    ProdutoSerializer,
    ProdutoDetalhadoSerializer,
    ProdutoVariacaoSerializer,
    ProdutoVariacaoUpdateSerializer,
    TipoPeleSerializer,
)


class CategoriaViewSet(PublicReadAdminWriteViewSetMixin, viewsets.ModelViewSet):
    """CRUD de categorias"""
    queryset = Categoria.objects.all().order_by('nome')
    serializer_class = CategoriaSerializer


class TipoPeleViewSet(PublicReadAdminWriteViewSetMixin, viewsets.ModelViewSet):
    """CRUD de tipos de pele (oleosa, mista, etc)"""
    queryset = TipoPele.objects.all().order_by('nome')
    serializer_class = TipoPeleSerializer


class ProdutoViewSet(PublicReadAdminWriteViewSetMixin, viewsets.ModelViewSet):
    """CRUD de produtos com categorias M2M e filtro por tipo de pele"""
    queryset = Produto.objects.all()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProdutoDetalhadoSerializer
        return ProdutoSerializer

    def get_queryset(self):
        qs = (super().get_queryset()
              .prefetch_related('categorias', 'variacoes', 'tipo_pele')
              .order_by('nome'))

        user = self.request.user
        is_admin = user.is_authenticated and getattr(user, 'cargo', None) == 'ADMIN'
        if not is_admin:
            qs = qs.filter(esta_ativo=True)

        categoria_id = self.request.query_params.get('categoria_id')
        if categoria_id:
            qs = qs.filter(categorias__id=categoria_id).distinct()

        tipo_pele_id = self.request.query_params.get('tipo_pele_id')
        if tipo_pele_id:
            qs = qs.filter(tipo_pele__id=tipo_pele_id).distinct()
        return qs


class ProdutoVariacaoViewSet(PublicReadAdminWriteViewSetMixin, viewsets.ModelViewSet):
    """CRUD de Variações de Produto"""
    queryset = ProdutoVariacao.objects.all()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProdutoVariacaoSerializer
        return ProdutoVariacaoUpdateSerializer

    def perform_destroy(self, instance):
        instance.apagado_em = timezone.now()
        instance.save(update_fields=['apagado_em'])

    def get_queryset(self):
        qs = (super().get_queryset())

        user = self.request.user
        is_admin = user.is_authenticated and getattr(user, 'cargo', None) == 'ADMIN'
        if not is_admin:
            qs = qs.filter(produto__esta_ativo=True).filter(apagado_em__isnull=True)

        produto_id = self.request.query_params.get('produto_id')
        if produto_id:
            qs = qs.filter(produto=produto_id)
        return qs

    @action(detail=True, methods=['patch'], url_path='restaurar')
    def restaurar(self, request, pk=None):
        variacao = self.get_object()

        if variacao.apagado_em is None:
            return Response(
                {'detail': 'Esta variação não está apagada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        variacao.apagado_em = None
        variacao.save(update_fields=['apagado_em'])

        return Response(ProdutoVariacaoSerializer(variacao).data, status=status.HTTP_200_OK)