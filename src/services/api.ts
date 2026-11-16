import { URL_API } from './config';
import { lerTokens, atualizarTokens, limparSessao } from './sessao';

export type Paginado<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type Parametros = Record<string, string | number | boolean | null | undefined>;

type Opcoes = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  corpo?: unknown;
  parametros?: Parametros;
  autenticado?: boolean;
};

export class ErroApi extends Error {
  status: number;
  codigo: string;
  erros: unknown;

  constructor(status: number, codigo: string, mensagem: string, erros: unknown) {
    super(mensagem);
    Object.setPrototypeOf(this, ErroApi.prototype);
    this.name = 'ErroApi';
    this.status = status;
    this.codigo = codigo;
    this.erros = erros;
  }
}

export function mensagemDeErro(erro: unknown, padrao: string) {
  return erro instanceof Error && erro.message ? erro.message : padrao;
}

function montarUrl(caminho: string, parametros?: Parametros) {
  const partes: string[] = [];
  if (parametros) {
    for (const chave of Object.keys(parametros)) {
      const valor = parametros[chave];
      if (valor !== undefined && valor !== null && valor !== '') {
        partes.push(encodeURIComponent(chave) + '=' + encodeURIComponent(String(valor)));
      }
    }
  }
  return URL_API + caminho + (partes.length > 0 ? '?' + partes.join('&') : '');
}

async function renovarToken() {
  const { renovacao } = await lerTokens();
  if (!renovacao) {
    return null;
  }
  try {
    const resposta = await fetch(URL_API + '/auth/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh: renovacao }),
    });
    if (!resposta.ok) {
      await limparSessao();
      return null;
    }
    const dados = await resposta.json();
    await atualizarTokens(dados.access, dados.refresh ?? renovacao);
    return dados.access as string;
  } catch {
    return null;
  }
}

export async function requisicao<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const { metodo = 'GET', corpo, parametros, autenticado = true } = opcoes;
  const ehFormData = typeof FormData !== 'undefined' && corpo instanceof FormData;

  async function enviar(token: string | null) {
    const cabecalhos: Record<string, string> = { Accept: 'application/json' };
    // Em multipart o React Native define o Content-Type (com o boundary) sozinho.
    if (!ehFormData) {
      cabecalhos['Content-Type'] = 'application/json';
    }
    if (token) {
      cabecalhos.Authorization = 'Bearer ' + token;
    }
    return fetch(montarUrl(caminho, parametros), {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : ehFormData ? (corpo as FormData) : JSON.stringify(corpo),
    });
  }

  const token = autenticado ? (await lerTokens()).acesso : null;

  let resposta: Response;
  try {
    resposta = await enviar(token);
  } catch {
    throw new ErroApi(0, 'sem_conexao', 'Não foi possível conectar ao servidor. Verifique sua conexão.', null);
  }

  if (resposta.status === 401 && autenticado && token) {
    const novoToken = await renovarToken();
    if (!novoToken) {
      throw new ErroApi(401, 'sessao_expirada', 'Sua sessão expirou. Entre novamente.', null);
    }
    resposta = await enviar(novoToken);
  }

  if (resposta.status === 204) {
    return undefined as T;
  }

  const dados = await resposta.json().catch(function () {
    return null;
  });

  if (!resposta.ok) {
    throw new ErroApi(resposta.status, dados?.code ?? 'erro', dados?.detail ?? 'Algo deu errado. Tente novamente.', dados?.errors ?? null);
  }

  return dados as T;
}