from django.urls import include, path
from rest_framework.routers import DefaultRouter

from orders.views import ClienteViewSet, PedidoViewSet

app_name = 'orders'

router = DefaultRouter()
router.register('clientes', ClienteViewSet, basename='cliente')
router.register('pedidos', PedidoViewSet, basename='pedido')

urlpatterns = [
    path('', include(router.urls)),
]