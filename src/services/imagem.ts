import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { URL_API } from './config';
import { lerTokens } from './sessao';
import { ErroApi, requisicao } from './api';

export type ArquivoImagem = {
  uri: string;
  nome: string;
  tipo: string;
};

const EXTENSAO_POR_TIPO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const TIPO_POR_EXTENSAO: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

async function enviarNoCelular(caminho: string, arquivo: ArquivoImagem) {
  const extensaoUri = (arquivo.uri.split('?')[0].split('.').pop() ?? '').toLowerCase();
  const tipo = TIPO_POR_EXTENSAO[extensaoUri] ?? arquivo.tipo ?? 'image/jpeg';

  const { acesso } = await lerTokens();
  const cabecalhos: Record<string, string> = { Accept: 'application/json' };
  if (acesso) {
    cabecalhos.Authorization = 'Bearer ' + acesso;
  }

  let resposta;
  try {
    resposta = await FileSystem.uploadAsync(URL_API + caminho, arquivo.uri, {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'imagem',
      mimeType: tipo,
      headers: cabecalhos,
    });
  } catch {
    throw new ErroApi(0, 'sem_conexao', 'Não foi possível conectar ao servidor. Verifique sua conexão.', null);
  }

  if (resposta.status === 401) {
    throw new ErroApi(401, 'sessao_expirada', 'Sua sessão expirou. Entre novamente.', null);
  }
  if (resposta.status < 200 || resposta.status >= 300) {
    let dados: { code?: string; detail?: string; errors?: unknown } | null = null;
    try {
      dados = JSON.parse(resposta.body);
    } catch {
      dados = null;
    }
    throw new ErroApi(resposta.status, dados?.code ?? 'erro', dados?.detail ?? 'Algo deu errado. Tente novamente.', dados?.errors ?? null);
  }
}

export async function enviarImagem(caminho: string, arquivo: ArquivoImagem) {
  if (Platform.OS !== 'web') {
    await enviarNoCelular(caminho, arquivo);
    return;
  }

  // Web: a uri é blob:/data:, então o tipo real vem do próprio conteúdo.
  const original = await (await fetch(arquivo.uri)).blob();
  const tipo = original.type || arquivo.tipo || 'image/jpeg';
  const extensao = EXTENSAO_POR_TIPO[tipo] ?? 'jpg';

  const formulario = new FormData();
  formulario.append('imagem', original, `imagem.${extensao}`);
  await requisicao<unknown>(caminho, { metodo: 'PUT', corpo: formulario });
}

export async function apagarImagem(caminho: string) {
  await requisicao<void>(caminho, { metodo: 'DELETE' });
}