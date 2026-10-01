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
    nr_cep_entrega = models.CharField(max_length=10, db_column='nr_cep_entrega')
    ds_logradouro_entrega = models.CharField(max_length=150, db_column='ds_logradouro_entrega')
    nr_entrega = models.CharField(max_length=20, db_column='nr_entrega')
    ds_complemento_entrega = models.CharField(max_length=50, blank=True, null=True, db_column='ds_complemento_entrega')
    nm_bairro_entrega = models.CharField(max_length=50, db_column='nm_bairro_entrega')
    nm_cidade_entrega = models.CharField(max_length=50, db_column='nm_cidade_entrega')
    sg_estado_entrega = models.CharField(max_length=2, db_column='sg_estado_entrega')
    st_pedido = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDENTE', db_column='st_pedido')
    vl_total = models.DecimalField(max_digits=10, decimal_places=2, db_column='vl_total')
    vl_frete = models.DecimalField(max_digits=10, decimal_places=2, db_column='vl_frete')
    dt_criacao = models.DateTimeField(auto_now_add=True, db_column='dt_criacao')
    dt_atualizacao = models.DateTimeField(auto_now_add=True, db_column='dt_atualizacao')
    itens = models.ManyToManyField(ProdutoVariacao, through='PedidoItem', related_name='pedidos')

    class Meta:
        db_table = 'pedido'

    def __str__(self):
        return f"Pedido #{self.id_pedido} - Status: {self.st_pedido}"


class PedidoItem(models.Model):
    pk = models.CompositePrimaryKey('id_pedido', 'id_variacao')
    id_pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, db_column='id_pedido')
    id_variacao = models.ForeignKey(ProdutoVariacao, on_delete=models.PROTECT, db_column='id_variacao')
    qtd_item = models.IntegerField(db_column='qtd_item')
    vl_unitario = models.DecimalField(max_digits=10, decimal_places=2, db_column='vl_unitario')

    class Meta:
        db_table = 'pedido_item'
