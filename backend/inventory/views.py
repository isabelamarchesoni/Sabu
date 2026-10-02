from rest_framework import viewsets
from accounts.mixins import AdminOnlyViewSetMixin
from .models import MateriaPrima, FichaTecnica, MovimentacaoEstoque
from .serializers import (
    MateriaPrimaSerializer,
    FichaTecnicaSerializer,
    FichaTecnicaDetalhadaSerializer,
    MovimentacaoEstoqueSerializer,
)


class MateriaPrimaViewSet(AdminOnlyViewSetMixin, viewsets.ModelViewSet):
    """CRUD de matérias-primas (apenas admin)"""
    queryset = MateriaPrima.objects.all().order_by('nm_materia_prima')
    serializer_class = MateriaPrimaSerializer


class FichaTecnicaViewSet(AdminOnlyViewSetMixin, viewsets.ModelViewSet):
    """CRUD de ficha técnica por variação de produto (apenas admin)"""
    queryset = FichaTecnica.objects.all()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return FichaTecnicaDetalhadaSerializer
        return FichaTecnicaSerializer

    def get_queryset(self):
        queryset = FichaTecnica.objects.select_related('id_materia_prima')
        variacao_id = self.request.query_params.get('variacao_id')
        if variacao_id:
            queryset = queryset.filter(id_variacao=variacao_id)
        return queryset


class MovimentacaoEstoqueViewSet(AdminOnlyViewSetMixin, viewsets.ModelViewSet):
    """Histórico e registro de movimentações de estoque (apenas admin)"""
    queryset = MovimentacaoEstoque.objects.all().order_by('-dt_movimentacao')
    serializer_class = MovimentacaoEstoqueSerializer

    def get_queryset(self):
        queryset = MovimentacaoEstoque.objects.all().order_by('-dt_movimentacao')
        variacao_id = self.request.query_params.get('variacao_id')
        if variacao_id:
            queryset = queryset.filter(id_variacao=variacao_id)
        return queryset