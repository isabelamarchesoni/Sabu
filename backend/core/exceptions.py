class ErroDeDominio(Exception):
    status_code = 400
    codigo = 'erro_dominio'
    mensagem_padrao = 'Erro de domínio.'

    def __init__(self, mensagem=None, **detalhes):
        self.mensagem = mensagem or self.mensagem_padrao
        self.detalhes = detalhes
        super().__init__(self.mensagem)