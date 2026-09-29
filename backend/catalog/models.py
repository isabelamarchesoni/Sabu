from django.db import models

class Categoria(models.Model):
    id_categoria = models.BigAutoField(primary_key=True, db_column='id_categoria')
    nm_categoria = models.CharField(max_length=50, unique=True, db_column='nm_categoria')

    class Meta:
        db_table = 'categoria'

    def __str__(self):
        return self.nm_categoria


class Produto(models.Model):
    id_produto = models.BigAutoField(primary_key=True, db_column='id_produto')
    nm_produto = models.CharField(max_length=100, db_column='nm_produto')
    ds_produto = models.TextField(blank=True, null=True, db_column='ds_produto')
    tipo_pele_produto = models.CharField(max_length=50, blank=True, null=True, db_column='tipo_pele_produto')
    produto_ativo = models.BooleanField(default=True, db_column='produto_ativo')
    dt_criacao = models.DateTimeField(auto_now_add=True, db_column='dt_criacao')
    categorias = models.ManyToManyField(Categoria, through='ProdutoCategoria', related_name='produtos')

    class Meta:
        db_table = 'produto'

    def __str__(self):
        return self.nm_produto


class ProdutoCategoria(models.Model):
    id_produto = models.ForeignKey(Produto, on_delete=models.CASCADE, db_column='id_produto')
    id_categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, db_column='id_categoria')

    class Meta:
        db_table = 'produto_categoria'
        unique_together = (('id_produto', 'id_categoria'),)


class ProdutoVariacao(models.Model):
    id_variacao = models.BigAutoField(primary_key=True, db_column='id_variacao')
    id_produto = models.ForeignKey(Produto, on_delete=models.CASCADE, db_column='id_produto', related_name='variacoes')
    sku_produto = models.CharField(max_length=50, unique=True, db_column='sku_produto')
    nm_variacao = models.CharField(max_length=50, db_column='nm_variacao')
    vl_produto = models.DecimalField(max_digits=10, decimal_places=2, db_column='vl_produto')
    vl_promo_produto = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, db_column='vl_promo_produto')
    dt_inicio_promo_produto = models.DateTimeField(blank=True, null=True, db_column='dt_inicio_promo_produto')
    dt_fim_promo_produto = models.DateTimeField(blank=True, null=True, db_column='dt_fim_promo_produto')
    peso_gramas_produto = models.IntegerField(blank=True, null=True, db_column='peso_gramas_produto')
    qtd_estoque_produto = models.IntegerField(db_column='qtd_estoque_produto')

    class Meta:
        db_table = 'produto_variacao'
        unique_together = (('id_produto', 'nm_variacao'),)

    def __str__(self):
        return f"{self.id_produto.nm_produto} - {self.nm_variacao}"
