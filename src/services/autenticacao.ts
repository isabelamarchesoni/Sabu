import { requisicao, ErroApi } from './api';
import { salvarSessao, limparSessao, lerUsuario, type RespostaLogin, type Usuario } from './sessao';

export async function entrar(email: string, senha: string): Promise<Usuario> {
  const resposta = await requisicao<RespostaLogin>('/auth/login/', {
    metodo: 'POST',
    corpo: { email: email, password: senha },
    autenticado: false,
  });

  if (resposta.cargo !== 'ADMIN') {
    throw new ErroApi(403, 'sem_permissao', 'Esta área é só para administradores.', null);
  }

  await salvarSessao(resposta);
  return { id: resposta.id, nome: resposta.nome, cargo: resposta.cargo };
}

export async function sair() {
  await limparSessao();
}

export async function usuarioAtual() {
  return lerUsuario();
}
export type DadosAdministrador = {
  nome: string;
  email: string;
  password: string;
  telefone: string;
  cpf_cnpj?: string;
};

export async function cadastrarAdministrador(dados: DadosAdministrador) {
  return requisicao<{ message: string; user: { id: number; nome: string; email: string } }>('/auth/registrar_admin/', { metodo: 'POST', corpo: dados });
}
