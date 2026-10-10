from rest_framework import viewsets, mixins
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
    queryset = MateriaPrima.objects.all().order_by('nome')
    serializer_class = MateriaPrimaSerializer


class FichaTecnicaViewSet(AdminOnlyViewSetMixin, viewsets.ModelViewSet):
    """CRUD de ficha técnica por variação de produto (apenas admin)"""
    queryset = FichaTecnica.objects.all()

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return FichaTecnicaDetalhadaSerializer
        return FichaTecnicaSerializer

    def get_queryset(self):
        queryset = FichaTecnica.objects.select_related('materia_prima')
        variacao_id = self.request.query_params.get('variacao_id')
        if variacao_id:
            queryset = queryset.filter(variacao=variacao_id)
        return queryset


class MovimentacaoEstoqueViewSet(AdminOnlyViewSetMixin,
                                 mixins.CreateModelMixin,
                                 mixins.RetrieveModelMixin,
                                 mixins.ListModelMixin,
                                 viewsets.GenericViewSet):
    """Histórico e registro de movimentações de estoque (apenas admin)"""
    queryset = MovimentacaoEstoque.objects.all().order_by('-movimentado_em')
    serializer_class = MovimentacaoEstoqueSerializer

    def get_queryset(self):
        queryset = MovimentacaoEstoque.objects.all().order_by('-movimentado_em')
        variacao_id = self.request.query_params.get('variacao_id')
        if variacao_id:
            queryset = queryset.filter(variacao=variacao_id)
        return queryset