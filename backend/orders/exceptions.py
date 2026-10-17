from core.exceptions import ErroDeDominio

class PedidoSemItem(ErroDeDominio):
    codigo = 'pedido_sem_item'
    mensagem_padrao = 'O pedido deve conter pelo menos um item.'

class TransicaoInvalida(ErroDeDominio):
    status_code = 409
    codigo = 'transicao_status_invalida'

    def __init__(self, *, atual, novo):
        self.atual = atual
        self.novo = novo
        super().__init__(
            f'Não é possível mudar o pedido de {atual} para {novo}.',
            atual=atual, novo=novo,
        )