from core.exceptions import ErroDeDominio


class EstoqueInsuficiente(ErroDeDominio):
    status_code = 409
    codigo = 'estoque_insuficiente'

    def __init__(self, *, variacao_id, sku, produto, saldo, solicitado):
        self.variacao_id = variacao_id
        self.sku = sku
        self.produto = produto
        self.saldo = saldo
        self.solicitado = solicitado
        super().__init__(
            f'Estoque insuficiente para "{produto}" (SKU {sku}). '
            f'Saldo atual: {saldo}, solicitado: {solicitado}.',
            variacao_id=variacao_id, sku=sku, produto=produto,
            saldo=saldo, solicitado=solicitado,
        )


class TipoMovimentacaoInvalido(ErroDeDominio):
    codigo = 'tipo_movimentacao_invalido'
    mensagem_padrao = 'Tipo de movimentação inválido.'


class MovimentacaoIncoerente(ErroDeDominio):
    codigo = 'movimentacao_incoerente'
    mensagem_padrao = 'Venda/estorno exigem pedido, os demais tipos não aceitam.'