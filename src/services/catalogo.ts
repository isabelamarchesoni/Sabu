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

export async function listarTiposPele(): Promise<TipoPele[]> {
  const resposta = await requisicao<Paginado<TipoPele>>('/catalog/tipo-pele/', { autenticado: false });
  return resposta.results;
}