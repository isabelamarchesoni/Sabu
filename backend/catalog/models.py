from django.db import models

class Categoria(models.Model):
    id = models.BigAutoField(primary_key=True)
    nome = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'categoria'

    def __str__(self):
        return self.nome

class TipoPele(models.Model):
    id = models.BigAutoField(primary_key=True)
    nome = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'tipo_pele'

    def __str__(self):
        return self.nome


class Produto(models.Model):
    id = models.BigAutoField(primary_key=True)
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, null=True)
    esta_ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    tipo_pele = models.ManyToManyField(TipoPele, through='ProdutoTipoPele', related_name='produtos')
    categorias = models.ManyToManyField(Categoria, through='ProdutoCategoria', related_name='produtos')

    class Meta:
        db_table = 'produto'

    def __str__(self):
        return self.nome


class ProdutoCategoria(models.Model):
    id = models.BigAutoField(primary_key=True)
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE)
    categoria = models.ForeignKey(Categoria, on_delete=models.CASCADE)

    class Meta:
        db_table = 'produto_categoria'
        constraints = [
            models.UniqueConstraint(
                fields=['produto', 'categoria'],
                name='uq_produto_categoria',
            ),
        ]

class ProdutoTipoPele(models.Model):
    id = models.BigAutoField(primary_key=True)
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE)
    tipo_pele = models.ForeignKey(TipoPele, on_delete=models.CASCADE)

    class Meta:
        db_table = 'produto_tipo_pele'
        constraints = [
            models.UniqueConstraint(
                fields=['produto', 'tipo_pele'],
                name='uq_produto_tipo_pele',
            )
        ]


class ProdutoVariacao(models.Model):
    id = models.BigAutoField(primary_key=True)
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name='variacoes')
    sku = models.CharField(max_length=50, unique=True)
    nome = models.CharField(max_length=50)
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    preco_promo = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    inicio_promo = models.DateTimeField(blank=True, null=True)
    fim_promo = models.DateTimeField(blank=True, null=True)
    peso_gramas = models.IntegerField(blank=True, null=True)
    quantidade_estoque = models.IntegerField()

    class Meta:
        db_table = 'produto_variacao'
        constraints = [
            models.UniqueConstraint(
                fields=['produto', 'nome'],
                name='uq_produto_nome',
            ),
        ]

    def __str__(self):
        return f"{self.produto.nome} - {self.nome}"
