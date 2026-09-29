from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MateriaPrimaViewSet,
    FichaTecnicaViewSet,
    MovimentacaoEstoqueViewSet,
)

app_name = 'inventory'

router = DefaultRouter()
router.register(r'materias-primas', MateriaPrimaViewSet, basename='materia-prima')
router.register(r'fichas-tecnicas', FichaTecnicaViewSet, basename='ficha-tecnica')
router.register(r'movimentacoes', MovimentacaoEstoqueViewSet, basename='movimentacao')

urlpatterns = [
    path('', include(router.urls)),
]
