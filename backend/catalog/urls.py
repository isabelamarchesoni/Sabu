from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, ProdutoViewSet, ProdutoVariacaoViewSet, TipoPeleViewSet

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'tipo-pele', TipoPeleViewSet, basename='tipo-pele')
router.register(r'produtos', ProdutoViewSet, basename='produto')
router.register(r'variacoes', ProdutoVariacaoViewSet, basename='variacao')

urlpatterns = [
    path('', include(router.urls)),
]
