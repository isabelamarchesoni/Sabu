from django.db import models
from accounts.models import Usuario
from catalog.models import ProdutoVariacao

class Pedido(models.Model):
    STATUS_CHOICES = (
        ('PENDENTE', 'Pendente'),
        ('PAGO', 'Pago'),
        ('ENVIADO', 'Enviado'),
        ('ENTREGUE', 'Entregue'),
        ('CANCELADO', 'Cancelado'),
    )

    id = models.BigAutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, related_name='pedidos')
    cep = models.CharField(max_length=10)
    logradouro = models.CharField(max_length=150)
    numero_residencia = models.CharField(max_length=20)
    complemento = models.CharField(max_length=50, blank=True, null=True)
    bairro = models.CharField(max_length=50)
    cidade = models.CharField(max_length=50)
    sigla_estado = models.CharField(max_length=2)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDENTE')
    valor_total = models.DecimalField(max_digits=10, decimal_places=2)
    valor_frete = models.DecimalField(max_digits=10, decimal_places=2)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now_add=True)
    itens = models.ManyToManyField(ProdutoVariacao, through='PedidoItem', related_name='pedidos')

    class Meta:
        db_table = 'pedido'

    def __str__(self):
        return f"Pedido #{self.id} - Status: {self.status}"


class PedidoItem(models.Model):
    id = models.BigAutoField(primary_key=True)
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE)
    variacao = models.ForeignKey(ProdutoVariacao, on_delete=models.PROTECT)
    quantidade_item = models.IntegerField()
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'pedido_item'
        constraints = [
            models.UniqueConstraint(
                fields=['pedido', 'variacao'],
                name='uq_pedido_variacao',
            ),
        ]
