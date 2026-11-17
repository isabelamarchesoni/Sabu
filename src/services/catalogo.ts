import { requisicao, type Paginado } from './api';
import { enviarImagem, apagarImagem, type ArquivoImagem } from './imagem';

export type Categoria = {
  id: number;
  nome: string;
};

export type TipoPele = {
  id: number;
  nome: string;
};

export type Ingrediente = {
  id: number;
  nome: string;
};

// Perfil usado pelo quiz de recomendação. Os valores são os do backend (em maiúsculas).
export type TipoPeleIndicado = 'SECA' | 'OLEOSA' | 'MISTA' | 'NORMAL' | 'TODOS';
export type BaseProduto = 'PROCESSO_A_FRIO' | 'GLICERINA' | 'BASE_VEGETAL';

export const TIPOS_PELE_INDICADO: { valor: TipoPeleIndicado; rotulo: string }[] = [
  { valor: 'TODOS', rotulo: 'Todos os tipos' },
  { valor: 'SECA', rotulo: 'Seca' },
  { valor: 'OLEOSA', rotulo: 'Oleosa' },
  { valor: 'MISTA', rotulo: 'Mista' },
  { valor: 'NORMAL', rotulo: 'Normal' },
];

export const BASES_PRODUTO: { valor: BaseProduto; rotulo: string }[] = [
  { valor: 'PROCESSO_A_FRIO', rotulo: 'Processo a frio' },
  { valor: 'GLICERINA', rotulo: 'Glicerina' },
  { valor: 'BASE_VEGETAL', rotulo: 'Base vegetal' },
];

export type Variacao = {
  id: number;
  produto: number;
  sku: string;
  nome: string;
  imagem: string | null;
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
  imagem: string | null;
  esta_ativo: boolean;
  criado_em: string;
  tipo_pele: TipoPele[];
  categorias: Categoria[];
  tipo_pele_indicado: TipoPeleIndicado;
  base: BaseProduto | '';
  essencia: string;
  sem_fragrancia: boolean;
  vegano: boolean;
  ingredientes: Ingrediente[];
  variacoes: Variacao[];
};

export type DadosProduto = {
  nome: string;
  descricao: string | null;
  esta_ativo: boolean;
  categorias: number[];
  tipo_pele: number[];
  tipo_pele_indicado: TipoPeleIndicado;
  base: BaseProduto | '';
  essencia: string;
  sem_fragrancia: boolean;
  vegano: boolean;
  ingredientes: number[];
};

type FiltrosProdutos = {
  pagina?: number;
  busca?: string;
  categoriaId?: number | null;
  tipoPeleId?: number | null;
};

type FiltrosProdutosAdmin = FiltrosProdutos & {
  ordenacao?: string;
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

export async function listarIngredientes(): Promise<Ingrediente[]> {
  const resposta = await requisicao<Paginado<Ingrediente>>('/catalog/ingredientes/', { autenticado: false });
  return resposta.results;
}

export async function listarIngredientesPaginados(filtros: FiltrosLista): Promise<Paginado<Ingrediente>> {
  return requisicao<Paginado<Ingrediente>>('/catalog/ingredientes/', {
    parametros: {
      page: filtros.pagina ?? 1,
      search: filtros.busca,
    },
  });
}

export async function buscarIngrediente(id: number): Promise<Ingrediente> {
  return requisicao<Ingrediente>(`/catalog/ingredientes/${id}/`);
}

export async function salvarIngrediente(id: number | null, nome: string): Promise<Ingrediente> {
  if (id === null) {
    return requisicao<Ingrediente>('/catalog/ingredientes/', { metodo: 'POST', corpo: { nome: nome } });
  }
  return requisicao<Ingrediente>(`/catalog/ingredientes/${id}/`, { metodo: 'PUT', corpo: { nome: nome } });
}

// Ingrediente ligado a produto não pode ser apagado: o backend responde 409 registro_protegido.
export async function apagarIngrediente(id: number) {
  await requisicao<void>(`/catalog/ingredientes/${id}/`, { metodo: 'DELETE' });
}

export async function listarProdutosAdmin(filtros: FiltrosProdutosAdmin): Promise<Paginado<Produto>> {
  return requisicao<Paginado<Produto>>('/catalog/produtos/', {
    parametros: {
      page: filtros.pagina ?? 1,
      search: filtros.busca,
      categoria_id: filtros.categoriaId,
      tipo_pele_id: filtros.tipoPeleId,
      ordering: filtros.ordenacao,
    },
  });
}

export async function buscarProdutoAdmin(id: number): Promise<Produto> {
  return requisicao<Produto>(`/catalog/produtos/${id}/`);
}

export async function salvarProduto(id: number | null, dados: DadosProduto): Promise<{ id: number }> {
  if (id === null) {
    return requisicao<{ id: number }>('/catalog/produtos/', { metodo: 'POST', corpo: dados });
  }
  return requisicao<{ id: number }>(`/catalog/produtos/${id}/`, { metodo: 'PUT', corpo: dados });
}

export async function apagarProduto(id: number) {
  await requisicao<void>(`/catalog/produtos/${id}/`, { metodo: 'DELETE' });
}

export async function enviarImagemProduto(id: number, arquivo: ArquivoImagem) {
  await enviarImagem(`/catalog/produtos/${id}/imagem/`, arquivo);
}

export async function apagarImagemProduto(id: number) {
  await apagarImagem(`/catalog/produtos/${id}/imagem/`);
}