from django.utils import timezone
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.mixins import AdminOnlyViewSetMixin
from core.mixins import FiltrosSomenteNaLeituraMixin
from .filters import FichaTecnicaFilter, MovimentacaoEstoqueFilter
from .models import MateriaPrima, FichaTecnica, MovimentacaoEstoque
from .schema import ficha_tecnica_schema, materia_prima_schema, movimentacao_schema
from .serializers import (
    MateriaPrimaSerializer,
    FichaTecnicaSerializer,
    FichaTecnicaDetalhadaSerializer,
    FichaTecnicaUpdateSerializer,
    MovimentacaoEstoqueSerializer,
)


@materia_prima_schema
class MateriaPrimaViewSet(AdminOnlyViewSetMixin, viewsets.ModelViewSet):
    queryset = MateriaPrima.objects.order_by('nome')
    serializer_class = MateriaPrimaSerializer


@ficha_tecnica_schema
class FichaTecnicaViewSet(AdminOnlyViewSetMixin, FiltrosSomenteNaLeituraMixin, viewsets.ModelViewSet):
    queryset = FichaTecnica.objects.select_related('materia_prima', 'variacao')
    filterset_class = FichaTecnicaFilter

    def get_serializer_class(self):
        if self.action in ('update', 'partial_update'):
            return FichaTecnicaUpdateSerializer
        if self.action in ['list', 'retrieve']:
            return FichaTecnicaDetalhadaSerializer
        return FichaTecnicaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action not in ('list', 'retrieve', 'restaurar'):
            qs = qs.filter(apagada_em__isnull=True)
        return qs

    def perform_destroy(self, instance):
        instance.apagada_em = timezone.now()
        instance.save(update_fields=['apagada_em'])

    @action(detail=True, methods=['patch'], url_path='restaurar')
    def restaurar(self, request, pk=None):
        ficha = self.get_object()

        if not ficha.apagada_em:
            return Response(
                {'detail': 'Esta ficha técnica não está apagada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if ficha.variacao.apagado_em:
            return Response(
                {'detail': 'Restaure a variação antes de restaurar a ficha técnica.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ficha.apagada_em = None
        ficha.save(update_fields=['apagada_em'])

        return Response(
            FichaTecnicaDetalhadaSerializer(ficha).data,
            status=status.HTTP_200_OK,
        )


@movimentacao_schema
class MovimentacaoEstoqueViewSet(AdminOnlyViewSetMixin,
                                 mixins.CreateModelMixin,
                                 mixins.RetrieveModelMixin,
                                 mixins.ListModelMixin,
                                 viewsets.GenericViewSet):
    queryset = (
        MovimentacaoEstoque.objects
        .select_related('variacao__produto')
        .order_by('-movimentado_em', '-pk')
    )
    serializer_class = MovimentacaoEstoqueSerializer
    filterset_class = MovimentacaoEstoqueFilter