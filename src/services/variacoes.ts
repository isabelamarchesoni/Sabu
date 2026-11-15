import { requisicao, type Paginado } from './api';
import type { Variacao } from './catalogo';

export type DadosVariacao = {
  produto: number;
  sku: string;
  nome: string;
  preco: string;
  preco_promo: string | null;
  inicio_promo: string | null;
  fim_promo: string | null;
  peso_gramas: number | null;
};

type FiltrosVariacoes = {
  pagina?: number;
  busca?: string;
  produtoId?: number | null;
  apagadas?: boolean | null;
  produtoAtivo?: boolean | null;
};

function textoBooleano(valor: boolean | null | undefined) {
  if (valor === null || valor === undefined) {
    return undefined;
  }
  return valor ? 'true' : 'false';
}

export async function listarVariacoes(filtros: FiltrosVariacoes): Promise<Paginado<Variacao>> {
  return requisicao<Paginado<Variacao>>('/catalog/variacoes/', {
    parametros: {
      page: filtros.pagina ?? 1,
      search: filtros.busca,
      produto_id: filtros.produtoId,
      apagadas: textoBooleano(filtros.apagadas),
      produto_ativo: textoBooleano(filtros.produtoAtivo),
    },
  });
}

export async function buscarVariacao(id: number): Promise<Variacao> {
  return requisicao<Variacao>(`/catalog/variacoes/${id}/`);
}

export async function salvarVariacao(id: number | null, dados: DadosVariacao): Promise<Variacao> {
  if (id === null) {
    return requisicao<Variacao>('/catalog/variacoes/', { metodo: 'POST', corpo: dados });
  }
  return requisicao<Variacao>(`/catalog/variacoes/${id}/`, { metodo: 'PUT', corpo: dados });
}

export async function apagarVariacao(id: number) {
  await requisicao<void>(`/catalog/variacoes/${id}/`, { metodo: 'DELETE' });
}

export async function restaurarVariacao(id: number): Promise<Variacao> {
  return requisicao<Variacao>(`/catalog/variacoes/${id}/restaurar/`, { metodo: 'PATCH' });
}