from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.mixins import AdminOnlyViewSetMixin
from orders.filters import ClienteFilter, PedidoFilter
from orders.models import Cliente, Pedido
from orders.schema import cliente_schema, pedido_schema
from orders.serializers import (
    ClienteSerializer, PedidoDetalhadoSerializer,
    PedidoCreateSerializer, PedidoUpdateSerializer,
)
from orders.services import concluir_pedido, cancelar_pedido, estornar_pedido


@cliente_schema
class ClienteViewSet(AdminOnlyViewSetMixin, viewsets.ModelViewSet):
    queryset = Cliente.objects.order_by('nome')
    serializer_class = ClienteSerializer
    filterset_class = ClienteFilter


@pedido_schema
class PedidoViewSet(AdminOnlyViewSetMixin,
                    mixins.CreateModelMixin,
                    mixins.ListModelMixin,
                    mixins.RetrieveModelMixin,
                    mixins.UpdateModelMixin,
                    viewsets.GenericViewSet):
    http_method_names = ['get', 'post', 'patch', 'head', 'options']
    queryset = (
        Pedido.objects
        .prefetch_related('pedido_itens__variacao__produto')
        .order_by('-criado_em', '-id')
    )
    filterset_class = PedidoFilter

    def get_serializer_class(self):
        if self.action == 'create':
            return PedidoCreateSerializer
        if self.action == 'partial_update':
            return PedidoUpdateSerializer
        return PedidoDetalhadoSerializer

    @action(detail=True, methods=['post'])
    def concluir(self, request, pk=None):
        pedido = concluir_pedido(pedido_id=self.get_object().pk)
        return Response(self.get_serializer(pedido).data)

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        pedido = cancelar_pedido(pedido_id=self.get_object().pk, usuario=request.user)
        return Response(self.get_serializer(pedido).data)

    @action(detail=True, methods=['post'])
    def estornar(self, request, pk=None):
        pedido = estornar_pedido(pedido_id=self.get_object().pk)
        return Response(self.get_serializer(pedido).data)