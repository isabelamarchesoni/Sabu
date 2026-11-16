import { Platform } from 'react-native';
import { requisicao } from './api';

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

export async function enviarImagem(caminho: string, arquivo: ArquivoImagem) {
  const formulario = new FormData();

  if (Platform.OS === 'web') {
    // Web: a uri é blob:/data:, então o tipo real vem do próprio conteúdo.
    const original = await (await fetch(arquivo.uri)).blob();
    const tipo = original.type || arquivo.tipo;
    const extensao = EXTENSAO_POR_TIPO[tipo] ?? 'jpg';
    const blob = original.type ? original : new Blob([original], { type: tipo });
    formulario.append('imagem', blob, `imagem.${extensao}`);
  } else {
    // Nativo: o RN lê o arquivo pela uri. Deriva tipo e nome da extensão final.
    const extensaoUri = (arquivo.uri.split('?')[0].split('.').pop() ?? '').toLowerCase();
    const conhecida = extensaoUri in TIPO_POR_EXTENSAO;
    const tipo = conhecida ? TIPO_POR_EXTENSAO[extensaoUri] : arquivo.tipo;
    const nome = `imagem.${conhecida ? extensaoUri : 'jpg'}`;
    formulario.append('imagem', { uri: arquivo.uri, name: nome, type: tipo } as unknown as Blob);
  }

  await requisicao<unknown>(caminho, { metodo: 'PUT', corpo: formulario });
}

export async function apagarImagem(caminho: string) {
  await requisicao<void>(caminho, { metodo: 'DELETE' });
}