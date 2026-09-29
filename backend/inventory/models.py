from django.db import models
from catalog.models import ProdutoVariacao

class MateriaPrima(models.Model):
    id_materia_prima = models.BigAutoField(primary_key=True, db_column='id_materia_prima')
    nm_materia_prima = models.CharField(max_length=100, unique=True, db_column='nm_materia_prima')
    unidade_medida = models.CharField(max_length=10, db_column='unidade_medida')
    qtd_estoque = models.DecimalField(max_digits=10, decimal_places=3, db_column='qtd_estoque')
    custo_unitario = models.DecimalField(max_digits=10, decimal_places=4, db_column='custo_unitario')

    class Meta:
        db_table = 'materia_prima'

    def __str__(self):
        return self.nm_materia_prima


class FichaTecnica(models.Model):
    id_variacao = models.ForeignKey(ProdutoVariacao, on_delete=models.CASCADE, db_column='id_variacao', related_name='fichas_tecnicas')
    id_materia_prima = models.ForeignKey(MateriaPrima, on_delete=models.RESTRICT, db_column='id_materia_prima', related_name='fichas_tecnicas')
    qtd_necessaria = models.DecimalField(max_digits=10, decimal_places=3, db_column='qtd_necessaria')

    class Meta:
        db_table = 'ficha_tecnica'
        unique_together = (('id_variacao', 'id_materia_prima'),)


class MovimentacaoEstoque(models.Model):
    TIPO_CHOICES = (
        ('ENTRADA', 'Entrada'),
        ('SAIDA_VENDA', 'Saída por Venda'),
        ('AJUSTE_PERDA', 'Ajuste / Perda'),
    )

    id_movimentacao = models.BigAutoField(primary_key=True, db_column='id_movimentacao')
    id_variacao = models.ForeignKey(ProdutoVariacao, on_delete=models.CASCADE, db_column='id_variacao', related_name='movimentacoes')
    tipo_movimentacao = models.CharField(max_length=20, choices=TIPO_CHOICES, db_column='tipo_movimentacao')
    qtd_movimentacao = models.IntegerField(db_column='qtd_movimentacao')
    ds_observacao = models.TextField(blank=True, null=True, db_column='ds_observacao')
    dt_movimentacao = models.DateTimeField(auto_now_add=True, db_column='dt_movimentacao')

    class Meta:
        db_table = 'movimentacao_estoque'

    def __str__(self):
        return f"{self.tipo_movimentacao} - Variacao ID: {self.id_variacao_id} ({self.qtd_movimentacao})"
