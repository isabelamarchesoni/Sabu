import { requisicao, type Paginado } from './api';

export type Categoria = {
  id: number;
  nome: string;
};

export type TipoPele = {
  id: number;
  nome: string;
};

export type Variacao = {
  id: number;
  produto: number;
  sku: string;
  nome: string;
  preco: string;
  preco_promo: string | null;
  inicio_promo: string | null;
  fim_promo: string | null;
  peso_gramas: number | null;
  quantidade_estoque: number;
  apagado_em: string | null;
  produto_abstrato_esta_ativo: boolean;
};

export type Produto = {
  id: number;
  nome: string;
  descricao: string | null;
  esta_ativo: boolean;
  criado_em: string;
  tipo_pele: TipoPele[];
  categorias: Categoria[];
  variacoes: Variacao[];
};

type FiltrosProdutos = {
  pagina?: number;
  busca?: string;
  categoriaId?: number | null;
  tipoPeleId?: number | null;
};

type FiltrosLista = {
  pagina?: number;
  busca?: string;
  ordenacao?: string;
};

export async function listarProdutos(filtros: FiltrosProdutos): Promise<Paginado<Produto>> {
  return requisicao<Paginado<Produto>>('/catalog/produtos/', {
    autenticado: false,
    parametros: {
      page: filtros.pagina ?? 1,
      search: filtros.busca,
      categoria_id: filtros.categoriaId,
      tipo_pele_id: filtros.tipoPeleId,
    },
  });
}

export async function buscarProduto(id: number): Promise<Produto> {
  return requisicao<Produto>(`/catalog/produtos/${id}/`, { autenticado: false });
}

export async function listarCategorias(): Promise<Categoria[]> {
  const resposta = await requisicao<Paginado<Categoria>>('/catalog/categorias/', { autenticado: false });
  return resposta.results;
}

export async function listarCategoriasPaginadas(filtros: FiltrosLista): Promise<Paginado<Categoria>> {
  return requisicao<Paginado<Categoria>>('/catalog/categorias/', {
    parametros: {
      page: filtros.pagina ?? 1,
      search: filtros.busca,
      ordering: filtros.ordenacao,
    },
  });
}

export async function buscarCategoria(id: number): Promise<Categoria> {
  return requisicao<Categoria>(`/catalog/categorias/${id}/`);
}

export async function salvarCategoria(id: number | null, nome: string): Promise<Categoria> {
  if (id === null) {
    return requisicao<Categoria>('/catalog/categorias/', { metodo: 'POST', corpo: { nome: nome } });
  }
  return requisicao<Categoria>(`/catalog/categorias/${id}/`, { metodo: 'PUT', corpo: { nome: nome } });
}

export async function apagarCategoria(id: number) {
  await requisicao<void>(`/catalog/categorias/${id}/`, { metodo: 'DELETE' });
}

export async function contarProdutosDaCategoria(id: number) {
  const resposta = await requisicao<Paginado<Produto>>('/catalog/produtos/', { parametros: { categoria_id: id, page: 1 } });
  return resposta.count;
}

export async function listarTiposPele(): Promise<TipoPele[]> {
  const resposta = await requisicao<Paginado<TipoPele>>('/catalog/tipo-pele/', { autenticado: false });
  return resposta.results;
}

export async function listarTiposPelePaginados(filtros: FiltrosLista): Promise<Paginado<TipoPele>> {
  return requisicao<Paginado<TipoPele>>('/catalog/tipo-pele/', {
    parametros: {
      page: filtros.pagina ?? 1,
      search: filtros.busca,
      ordering: filtros.ordenacao,
    },
  });
}

export async function buscarTipoPele(id: number): Promise<TipoPele> {
  return requisicao<TipoPele>(`/catalog/tipo-pele/${id}/`);
}

export async function salvarTipoPele(id: number | null, nome: string): Promise<TipoPele> {
  if (id === null) {
    return requisicao<TipoPele>('/catalog/tipo-pele/', { metodo: 'POST', corpo: { nome: nome } });
  }
  return requisicao<TipoPele>(`/catalog/tipo-pele/${id}/`, { metodo: 'PUT', corpo: { nome: nome } });
}

export async function apagarTipoPele(id: number) {
  await requisicao<void>(`/catalog/tipo-pele/${id}/`, { metodo: 'DELETE' });
}

export async function contarProdutosDoTipoPele(id: number) {
  const resposta = await requisicao<Paginado<Produto>>('/catalog/produtos/', { parametros: { tipo_pele_id: id, page: 1 } });
  return resposta.count;
}