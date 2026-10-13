from django.db import models
from accounts.models import Usuario
from catalog.models import ProdutoVariacao

class StatusPedido(models.TextChoices):
    PENDENTE = 'PENDENTE', 'Pendente'
    PAGO = 'PAGO', 'Pago'
    ENVIADO = 'ENVIADO', 'Enviado'
    ENTREGUE = 'ENTREGUE', 'Entregue'
    CANCELADO = 'CANCELADO', 'Cancelado'

TRANSICOES_PERMITIDAS = {
    StatusPedido.PENDENTE: {StatusPedido.PAGO, StatusPedido.CANCELADO},
    StatusPedido.PAGO: {StatusPedido.ENVIADO, StatusPedido.CANCELADO, StatusPedido.ENTREGUE},
    StatusPedido.ENVIADO: {StatusPedido.ENTREGUE},
    StatusPedido.ENTREGUE: set(),
    StatusPedido.CANCELADO: set(),
}

class Pedido(models.Model):
    id = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, related_name='pedidos')
    cep = models.CharField(max_length=10)
    logradouro = models.CharField(max_length=150)
    numero_residencia = models.CharField(max_length=20)
    complemento = models.CharField(max_length=50, blank=True)
    bairro = models.CharField(max_length=50)
    cidade = models.CharField(max_length=50)
    sigla_estado = models.CharField(max_length=2)
    status = models.CharField(max_length=30, choices=StatusPedido.choices, default='PENDENTE')
    valor_total = models.DecimalField(max_digits=10, decimal_places=2)
    valor_frete = models.DecimalField(max_digits=10, decimal_places=2)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    itens = models.ManyToManyField(ProdutoVariacao, through='PedidoItem', related_name='pedidos')

    class Meta:
        db_table = 'pedido'
        constraints = [
            models.CheckConstraint(
                condition=models.Q(status__in=StatusPedido.values),
                name='ck_pedido_status_valido',
            ),
            models.CheckConstraint(
                condition=models.Q(valor_frete__gte=0),
                name='ck_pedido_valor_frete_nao_negativo',
            ),
            models.CheckConstraint(
                condition=models.Q(valor_total__gte=0),
                name='ck_pedido_valor_total_nao_negativo',
            ),
            models.CheckConstraint(
                condition=models.Q(valor_total__gte=models.F('valor_frete')),
                name='ck_pedido_total_maior_ou_igual_frete',
            ),
        ]

    def __str__(self):
        return f"Pedido #{self.id} - Status: {self.get_status_display()}"


class PedidoItem(models.Model):
    id = models.BigAutoField(primary_key=True)
    pedido = models.ForeignKey(Pedido, on_delete=models.PROTECT)
    variacao = models.ForeignKey(ProdutoVariacao, on_delete=models.PROTECT)
    quantidade_item = models.PositiveIntegerField()
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'pedido_item'
        constraints = [
            models.UniqueConstraint(
                fields=['pedido', 'variacao'],
                name='uq_pedido_variacao',
            ),
            models.CheckConstraint(
                condition=models.Q(quantidade_item__gt=0),
                name='ck_item_quantidade_positiva',
            )
        ]
