import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_ACESSO = 'sabu:acesso';
const CHAVE_RENOVACAO = 'sabu:renovacao';
const CHAVE_USUARIO = 'sabu:usuario';

export type Usuario = {
  id: number;
  nome: string;
  cargo: string;
};

export type RespostaLogin = Usuario & {
  access: string;
  refresh: string;
};

export async function salvarSessao(resposta: RespostaLogin) {
  await AsyncStorage.multiSet([
    [CHAVE_ACESSO, resposta.access],
    [CHAVE_RENOVACAO, resposta.refresh],
    [CHAVE_USUARIO, JSON.stringify({ id: resposta.id, nome: resposta.nome, cargo: resposta.cargo })],
  ]);
}

export async function atualizarTokens(acesso: string, renovacao: string) {
  await AsyncStorage.multiSet([
    [CHAVE_ACESSO, acesso],
    [CHAVE_RENOVACAO, renovacao],
  ]);
}

export async function lerTokens() {
  const acesso = await AsyncStorage.getItem(CHAVE_ACESSO);
  const renovacao = await AsyncStorage.getItem(CHAVE_RENOVACAO);
  return { acesso, renovacao };
}

export async function lerUsuario(): Promise<Usuario | null> {
  const texto = await AsyncStorage.getItem(CHAVE_USUARIO);
  return texto ? JSON.parse(texto) : null;
}

export async function limparSessao() {
  await AsyncStorage.multiRemove([CHAVE_ACESSO, CHAVE_RENOVACAO, CHAVE_USUARIO]);
}