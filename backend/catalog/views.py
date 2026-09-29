from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from accounts.permissions import IsAdminUserCargo
from .models import Categoria, Produto, ProdutoVariacao
from .serializers import (
    CategoriaSerializer,
    ProdutoSerializer,
    ProdutoDetalhadoSerializer,
    ProdutoVariacaoSerializer,
)


class CategoriaViewSet(viewsets.ModelViewSet):
    """CRUD de categorias"""
    queryset = Categoria.objects.all().order_by('nm_categoria')
    serializer_class = CategoriaSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUserCargo()]


class ProdutoViewSet(viewsets.ModelViewSet):
    """CRUD de produtos com categorias M2M e filtro por tipo de pele"""
    queryset = Produto.objects.filter(produto_ativo=True).order_by('nm_produto')

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUserCargo()]

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ProdutoDetalhadoSerializer
        return ProdutoSerializer

    def get_queryset(self):
        # O prefetch_related otimiza a consulta trazendo categorias e variações em poucas queries SQL
        queryset = Produto.objects.all().prefetch_related('categorias', 'variacoes').order_by('nm_produto')
        
        # Filtro por ID da categoria (M2M): GET /api/v1/catalog/produtos/?categoria_id=2
        categoria_id = self.request.query_params.get('categoria_id')
        if categoria_id:
            queryset = queryset.filter(categorias__id_categoria=categoria_id)

        # Filtro por tipo de pele: GET /api/v1/catalog/produtos/?tipo_pele=OLEOSA
        tipo_pele = self.request.query_params.get('tipo_pele')
        if tipo_pele:
            queryset = queryset.filter(tipo_pele_produto__iexact=tipo_pele)

        # Se não for ADMIN, exibe somente produtos com produto_ativo = True
        if not (self.request.user.is_authenticated and self.request.user.cargo_usuario == 'ADMIN'):
            queryset = queryset.filter(produto_ativo=True)

        return queryset


class ProdutoVariacaoViewSet(viewsets.ModelViewSet):
    """CRUD de Variações de Produto"""
    queryset = ProdutoVariacao.objects.all()
    serializer_class = ProdutoVariacaoSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUserCargo()]

    def get_queryset(self):
        queryset = ProdutoVariacao.objects.all()
        produto_id = self.request.query_params.get('produto_id')
        if produto_id:
            queryset = queryset.filter(id_produto=produto_id)
        return queryset
