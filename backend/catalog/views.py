from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from accounts.mixins import PublicReadAdminWriteViewSetMixin
from accounts.permissions import IsAdminUserCargo
from .models import Categoria, Produto, ProdutoVariacao
from .serializers import (
    CategoriaSerializer,
    ProdutoSerializer,
    ProdutoDetalhadoSerializer,
    ProdutoVariacaoSerializer,
)


class CategoriaViewSet(PublicReadAdminWriteViewSetMixin, viewsets.ModelViewSet):
    """CRUD de categorias"""
    queryset = Categoria.objects.all().order_by('nome')
    serializer_class = CategoriaSerializer


class ProdutoViewSet(PublicReadAdminWriteViewSetMixin, viewsets.ModelViewSet):
    """CRUD de produtos com categorias M2M e filtro por tipo de pele"""
    queryset = Produto.objects.filter(esta_ativo=True).order_by('nome')

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProdutoDetalhadoSerializer
        return ProdutoSerializer

    def get_queryset(self):
        queryset = Produto.objects.all().prefetch_related('categorias', 'variacoes').order_by('nome')

        categoria_id = self.request.query_params.get('categoria_id')
        if categoria_id:
            queryset = queryset.filter(categorias__id=categoria_id)

        tipo_pele = self.request.query_params.get('tipo_pele')
        if tipo_pele:
            queryset = queryset.filter(tipo_pele__iexact=tipo_pele)

        user = self.request.user
        is_admin = user.is_authenticated and getattr(user, 'tp_cargo', None) == 'ADMIN'
        if not is_admin:
            queryset = queryset.filter(esta_ativo=True)

        return queryset


class ProdutoVariacaoViewSet(PublicReadAdminWriteViewSetMixin, viewsets.ModelViewSet):
    """CRUD de Variações de Produto"""
    queryset = ProdutoVariacao.objects.all()
    serializer_class = ProdutoVariacaoSerializer

    def get_queryset(self):
        queryset = ProdutoVariacao.objects.all()
        produto_id = self.request.query_params.get('produto_id')
        if produto_id:
            queryset = queryset.filter(produto=produto_id)
        return queryset