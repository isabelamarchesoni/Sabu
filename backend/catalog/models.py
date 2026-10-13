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
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT, related_name='variacoes')
    sku = models.CharField(max_length=50, unique=True)
    nome = models.CharField(max_length=50)
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    preco_promo = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    inicio_promo = models.DateTimeField(blank=True, null=True)
    fim_promo = models.DateTimeField(blank=True, null=True)
    peso_gramas = models.PositiveIntegerField(blank=True, null=True)
    quantidade_estoque = models.PositiveIntegerField(default=0, editable=False)
    apagado_em = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'produto_variacao'
        constraints = [
            models.UniqueConstraint(
                fields=['produto', 'nome'],
                name='uq_produto_nome',
            ),
            models.CheckConstraint(
                condition=models.Q(peso_gramas__isnull=True) | models.Q(peso_gramas__gt=0),
                name='ck_variacao_peso_positivo',
            ),
            models.CheckConstraint(
                name='ck_variacao_preco_nao_negativo',
                condition=models.Q(preco__gte=0)
            ),
            models.CheckConstraint(
                name='ck_variacao_preco_promo_nulo_ou_nao_negativo',
                condition=models.Q(preco_promo__isnull=True) |
                models.Q(preco_promo__gte=0)
            ),
            models.CheckConstraint(
                name='ck_variacao_preco_promo_menor_que_preco',
                condition=(
                        models.Q(preco_promo__isnull=True)
                        | models.Q(preco_promo__lt=models.F('preco'))
                ),
            ),
            models.CheckConstraint(
                name='ck_variacao_promo_exige_periodo',
                condition=(
                        models.Q(preco_promo__isnull=True)
                        | (
                                models.Q(inicio_promo__isnull=False)
                                & models.Q(fim_promo__isnull=False)
                        )
                ),
            ),
            models.CheckConstraint(
                name='ck_variacao_inicio_promo_antes_do_fim',
                condition=(
                        models.Q(inicio_promo__isnull=True)
                        | models.Q(fim_promo__isnull=True)
                        | models.Q(inicio_promo__lt=models.F('fim_promo'))
                ),
            )
        ]

    def __str__(self):
        return f"{self.produto.nome} - {self.nome}"
