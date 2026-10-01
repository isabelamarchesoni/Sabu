from django.db import models

from accounts.models import Usuario
from catalog.models import ProdutoVariacao
from orders.models import Pedido


class MateriaPrima(models.Model):
    id_materia_prima = models.BigAutoField(primary_key=True, db_column='id_materia_prima')
    nm_materia_prima = models.CharField(max_length=100, unique=True, db_column='nm_materia_prima')
    sg_unidade_medida = models.CharField(max_length=10, db_column='sg_unidade_medida')
    qtd_estoque = models.DecimalField(max_digits=10, decimal_places=3, db_column='qtd_estoque')
    vl_custo_unitario = models.DecimalField(max_digits=10, decimal_places=4, db_column='vl_custo_unitario')

    class Meta:
        db_table = 'materia_prima'

    def __str__(self):
        return self.nm_materia_prima


class FichaTecnica(models.Model):
    id_ficha = models.BigAutoField(primary_key=True, db_column='id_ficha')
    id_variacao = models.ForeignKey(ProdutoVariacao, on_delete=models.CASCADE, db_column='id_variacao', related_name='fichas_tecnicas')
    id_materia_prima = models.ForeignKey(MateriaPrima, on_delete=models.RESTRICT, db_column='id_materia_prima', related_name='fichas_tecnicas')
    qtd_necessaria = models.DecimalField(max_digits=10, decimal_places=3, db_column='qtd_necessaria')

    class Meta:
        db_table = 'ficha_tecnica'
        constraints = [
            models.UniqueConstraint(
                fields=['id_variacao', 'id_materia_prima'],
                name='uq_ficha_variacao_materia',
            ),
        ]


class MovimentacaoEstoque(models.Model):
    TIPO_CHOICES = (
        ('ENTRADA', 'Entrada'),
        ('SAIDA_VENDA', 'Saída por Venda'),
        ('AJUSTE_PERDA', 'Ajuste / Perda'),
    )

    id_movimentacao = models.BigAutoField(primary_key=True, db_column='id_movimentacao')
    id_variacao = models.ForeignKey(ProdutoVariacao, on_delete=models.CASCADE, db_column='id_variacao', related_name='movimentacoes')
    id_usuario_responsavel = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, db_column='id_usuario_responsavel', related_name='movimentacoes')
    id_pedido = models.ForeignKey(Pedido, on_delete=models.SET_NULL, null=True, db_column='id_pedido', related_name='movimentacoes')
    tp_movimentacao = models.CharField(max_length=20, choices=TIPO_CHOICES, db_column='tp_movimentacao')
    qtd_movimentacao = models.IntegerField(db_column='qtd_movimentacao')
    ds_observacao = models.TextField(blank=True, null=True, db_column='ds_observacao')
    dt_movimentacao = models.DateTimeField(auto_now_add=True, db_column='dt_movimentacao')

    class Meta:
        db_table = 'movimentacao_estoque'

    def __str__(self):
        return f"{self.tp_movimentacao} - Variacao ID: {self.id_variacao_id} ({self.qtd_movimentacao})"
