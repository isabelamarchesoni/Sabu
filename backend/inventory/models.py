from django.db import models

from accounts.models import Usuario
from catalog.models import ProdutoVariacao
from orders.models import Pedido


class MateriaPrima(models.Model):
    id = models.BigAutoField(primary_key=True)
    nome = models.CharField(max_length=100, unique=True)
    unidade_medida = models.CharField(max_length=10)
    quantidade_estoque = models.DecimalField(max_digits=10, decimal_places=3)
    valor_custo_unitario = models.DecimalField(max_digits=10, decimal_places=4)

    class Meta:
        db_table = 'materia_prima'

    def __str__(self):
        return self.nome


class FichaTecnica(models.Model):
    id = models.BigAutoField(primary_key=True)
    variacao = models.ForeignKey(ProdutoVariacao, on_delete=models.CASCADE, related_name='fichas_tecnicas')
    materia_prima = models.ForeignKey(MateriaPrima, on_delete=models.RESTRICT)
    quantidade_necessaria = models.DecimalField(max_digits=10, decimal_places=3)

    class Meta:
        db_table = 'ficha_tecnica'
        constraints = [
            models.UniqueConstraint(
                fields=['variacao', 'materia_prima'],
                name='uq_ficha_variacao_materia',
            ),
        ]


class MovimentacaoEstoque(models.Model):
    TIPO_CHOICES = (
        ('ENTRADA', 'Entrada'),
        ('SAIDA_VENDA', 'Saída por Venda'),
        ('AJUSTE_PERDA', 'Ajuste / Perda'),
    )

    id = models.BigAutoField(primary_key=True)
    variacao = models.ForeignKey(ProdutoVariacao, on_delete=models.RESTRICT, related_name='movimentacoes')
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='movimentacoes')
    pedido = models.ForeignKey(Pedido, on_delete=models.SET_NULL, null=True, related_name='movimentacoes')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    quantidade_movimentada = models.IntegerField()
    observacao = models.TextField(blank=True, null=True)
    movimentado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'movimentacao_estoque'

    def __str__(self):
        return f"{self.tipo} - Variacao ID: {self.variacao} ({self.quantidade_movimentada})"
