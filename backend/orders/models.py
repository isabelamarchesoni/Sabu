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

    id_pedido = models.BigAutoField(primary_key=True, db_column='id_pedido')
    id_usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='id_usuario', related_name='pedidos')
    entrega_cep = models.CharField(max_length=10, db_column='entrega_cep')
    entrega_logradouro = models.CharField(max_length=150, db_column='entrega_logradouro')
    entrega_numero = models.CharField(max_length=20, db_column='entrega_numero')
    entrega_complemento = models.CharField(max_length=50, blank=True, null=True, db_column='entrega_complemento')
    entrega_bairro = models.CharField(max_length=50, db_column='entrega_bairro')
    entrega_cidade = models.CharField(max_length=50, db_column='entrega_cidade')
    entrega_estado = models.CharField(max_length=2, db_column='entrega_estado')
    status_pedido = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDENTE', db_column='status_pedido')
    vl_total_pedido = models.DecimalField(max_digits=10, decimal_places=2, db_column='vl_total_pedido')
    vl_frete_pedido = models.DecimalField(max_digits=10, decimal_places=2, db_column='vl_frete_pedido')
    dt_criacao = models.DateTimeField(auto_now_add=True, db_column='dt_criacao')
    itens = models.ManyToManyField(ProdutoVariacao, through='PedidoItem', related_name='pedidos')

    class Meta:
        db_table = 'pedido'

    def __str__(self):
        return f"Pedido #{self.id_pedido} - Status: {self.status_pedido}"


class PedidoItem(models.Model):
    id_pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, db_column='id_pedido')
    id_variacao = models.ForeignKey(ProdutoVariacao, on_delete=models.PROTECT, db_column='id_variacao')
    quantidade = models.IntegerField(db_column='quantidade')
    preco = models.DecimalField(max_digits=10, decimal_places=2, db_column='preco')

    class Meta:
        db_table = 'pedido_item'
        unique_together = (('id_pedido', 'id_variacao'),)
