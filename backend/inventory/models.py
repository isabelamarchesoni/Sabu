from decimal import Decimal

from django.db import models

from accounts.models import Usuario
from catalog.models import ProdutoVariacao
from orders.models import Pedido


class MateriaPrima(models.Model):
    UNIDADE_CHOICES = (
        ('KG', 'Quilograma'),
        ('G', 'Grama'),
        ('MG', 'Miligrama'),
        ('L', 'Litro'),
        ('ML', 'Mililitro'),
        ('UN', 'Unidade'),
    )

    id = models.BigAutoField(primary_key=True)
    nome = models.CharField(max_length=100, unique=True)
    unidade_medida = models.CharField(max_length=10, choices=UNIDADE_CHOICES)
    quantidade_estoque = models.DecimalField(max_digits=10, decimal_places=3)
    valor_custo_unitario = models.DecimalField(max_digits=10, decimal_places=4)

    class Meta:
        db_table = 'materia_prima'
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantidade_estoque__gte=0),
                name='ck_materia_prima_estoque_nao_negativo',
            ),
            models.CheckConstraint(
                condition=models.Q(valor_custo_unitario__gte=0),
                name='ck_materia_prima_custo_nao_negativo',
            )
        ]

    def __str__(self):
        return self.nome


class FichaTecnica(models.Model):
    id = models.BigAutoField(primary_key=True)
    variacao = models.ForeignKey(ProdutoVariacao, on_delete=models.PROTECT, related_name='fichas_tecnicas')
    materia_prima = models.ForeignKey(MateriaPrima, on_delete=models.RESTRICT)
    quantidade_necessaria = models.DecimalField(max_digits=10, decimal_places=3)
    apagada_em = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'ficha_tecnica'
        constraints = [
            models.UniqueConstraint(
                fields=['variacao', 'materia_prima'],
                name='uq_ficha_variacao_materia',
            ),
            models.CheckConstraint(
                condition=models.Q(quantidade_necessaria__gte=Decimal('0.001')),
                name='ck_quantidade_necessaria_positiva',
            )
        ]

class TipoMovimentacao(models.TextChoices):
    ENTRADA = 'ENTRADA', 'Entrada'
    SAIDA_VENDA = 'SAIDA_VENDA', 'Saída por Venda'
    AJUSTE_OU_PERDA = 'AJUSTE_OU_PERDA', 'Ajuste / Perda'
    ESTORNO_VENDA = 'ESTORNO_VENDA', 'Estorno de Venda'

TIPOS_COM_PEDIDO = (TipoMovimentacao.SAIDA_VENDA, TipoMovimentacao.ESTORNO_VENDA)
TIPOS_QUE_AUMENTAM = {TipoMovimentacao.ENTRADA, TipoMovimentacao.ESTORNO_VENDA}
TIPOS_QUE_DIMINUEM = {TipoMovimentacao.SAIDA_VENDA, TipoMovimentacao.AJUSTE_OU_PERDA}

class MovimentacaoEstoque(models.Model):
    id = models.BigAutoField(primary_key=True)
    variacao = models.ForeignKey(ProdutoVariacao, on_delete=models.PROTECT, related_name='movimentacoes')
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='movimentacoes')
    pedido = models.ForeignKey(Pedido, on_delete=models.PROTECT, null=True, related_name='movimentacoes')
    tipo = models.CharField(max_length=20, choices=TipoMovimentacao.choices)
    quantidade_movimentada = models.PositiveIntegerField()
    observacao = models.TextField(blank=True)
    movimentado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'movimentacao_estoque'
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantidade_movimentada__gt=0),
                name='ck_quantidade_movimentada_positiva',
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(tipo__in=TIPOS_COM_PEDIDO, pedido__isnull=False)
                    | (
                            ~models.Q(tipo__in=TIPOS_COM_PEDIDO)
                            & models.Q(pedido__isnull=True)
                    )
                ),
                name='ck_movimentacao_pedido_conforme_tipo',
            ),
        ]

    def __str__(self):
        return f"{self.tipo} - Variacao ID: {self.variacao} ({self.quantidade_movimentada})"
