from core.exceptions import ErroDeDominio


class EstoqueInsuficiente(ErroDeDominio):
    status_code = 409
    codigo = 'estoque_insuficiente'

    def __init__(self, saldo, solicitado):
        self.saldo = saldo
        self.solicitado = solicitado
        super().__init__(
            f'Estoque insuficiente. Saldo atual: {saldo}, solicitado: {solicitado}.',
            saldo=saldo, solicitado=solicitado,
        )


class TipoMovimentacaoInvalido(ErroDeDominio):
    codigo = 'tipo_movimentacao_invalido'
    mensagem_padrao = 'Tipo de movimentação inválido.'


class MovimentacaoIncoerente(ErroDeDominio):
    codigo = 'movimentacao_incoerente'
    mensagem_padrao = 'Venda/estorno exigem pedido, os demais tipos não aceitam.'