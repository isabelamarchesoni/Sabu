from django.db import models
from accounts.models import Usuario
from catalog.models import ProdutoVariacao

class StatusPedido(models.TextChoices):
    PENDENTE = 'PENDENTE', 'Pendente'
    CONCLUIDO = 'CONCLUIDO', 'Concluido'
    CANCELADO = 'CANCELADO', 'Cancelado'
    ESTORNADO = 'ESTORNADO', 'Estornado'

TRANSICOES_PERMITIDAS = {
    StatusPedido.PENDENTE: {StatusPedido.CONCLUIDO, StatusPedido.CANCELADO},
    StatusPedido.CONCLUIDO: {StatusPedido.ESTORNADO},
    StatusPedido.CANCELADO: set(),
    StatusPedido.ESTORNADO: set(),
}

class Cliente(models.Model):
    id = models.BigAutoField(primary_key=True)
    nome = models.CharField(max_length=100, blank=True)
    telefone = models.CharField(max_length=20, blank=True)
    cpf_cnpj = models.CharField(max_length=20, unique=True, blank=True, null=True)
    ultimo_pedido_em = models.DateTimeField(null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cliente'

    def __str__(self):
        return self.nome

class Pedido(models.Model):
    id = models.BigAutoField(primary_key=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True, related_name='pedidos')
    cep = models.CharField(max_length=10, blank=True)
    logradouro = models.CharField(max_length=150, blank=True)
    numero_residencia = models.CharField(max_length=20, blank=True)
    complemento = models.CharField(max_length=50, blank=True)
    bairro = models.CharField(max_length=50, blank=True)
    cidade = models.CharField(max_length=50, blank=True)
    sigla_estado = models.CharField(max_length=2, blank=True)
    status = models.CharField(max_length=30, choices=StatusPedido.choices, default='PENDENTE')
    valor_total = models.DecimalField(max_digits=10, decimal_places=2) # Isso deve ser somente uma snapshot do valor do pedido
    observacao = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pedido'
        constraints = [
            models.CheckConstraint(
                condition=models.Q(status__in=StatusPedido.values),
                name='ck_pedido_status_valido',
            ),
            models.CheckConstraint(
                condition=models.Q(valor_total__gte=0),
                name='ck_pedido_valor_total_nao_negativo',
            ),
        ]

    def __str__(self):
        return f"Pedido #{self.id} - Status: {self.get_status_display()}"


class PedidoItem(models.Model):
    id = models.BigAutoField(primary_key=True)
    pedido = models.ForeignKey(Pedido, on_delete=models.PROTECT, related_name='pedido_itens')
    variacao = models.ForeignKey(ProdutoVariacao, on_delete=models.PROTECT, related_name='pedido_itens')
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
            ),
            models.CheckConstraint(
                condition=models.Q(quantidade_item__lte=999),
                name='ck_item_quantidade_limite_maximo',
            )
        ]
