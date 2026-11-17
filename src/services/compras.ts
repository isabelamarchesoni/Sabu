import { requisicao, type Paginado } from './api';
import { booleanoTexto, type MateriaPrima, type TipoMateriaPrima } from './estoque';

export type Fornecedor = {
  id: number;
  nome: string;
  categorias: TipoMateriaPrima[];
  plataforma: string;
  email: string;
  telefone: string;
  prazo_medio_entrega_em_dias: number;
  forma_pagamento: string;
  link: string;
  favorito: boolean;
  apagado_em: string | null;
};

export type DadosFornecedor = {
  nome: string;
  categorias: TipoMateriaPrima[];
  prazo_medio_entrega_em_dias: number;
  favorito: boolean;
  plataforma?: string;
  email?: string;
  telefone?: string;
  forma_pagamento?: string;
  link?: string;
};

export type StatusCompra = 'CONCLUIDO' | 'DEVOLVIDO';

export const SITUACOES_COMPRA: Record<StatusCompra, { texto: string; tom: 'sucesso' | 'alerta' }> = {
  CONCLUIDO: { texto: 'Concluída', tom: 'sucesso' },
  DEVOLVIDO: { texto: 'Devolvida', tom: 'alerta' },
};

export type ItemCompra = {
  id: number;
  materia_prima: number;
  quantidade_item: string;
  custo_unitario_momento_compra: string;
  lote: string;
};

export type Compra = {
  id: number;
  fornecedor: number;
  status: StatusCompra;
  valor_total: string;
  observacao: string;
  compra_realizada_em: string;
  atualizada_em: string;
  itens: ItemCompra[];
};

export type DadosItemCompra = {
  materia_prima: number;
  quantidade_item: string;
  custo_unitario_momento_compra: string;
  numero_lote_fabricante?: string;
  data_validade?: string;
};

export type DadosCompra = {
  fornecedor: number;
  observacao?: string;
  itens: DadosItemCompra[];
};

export async function listarFornecedores(filtros: { pagina?: number; busca?: string; apagados?: boolean | null }): Promise<Paginado<Fornecedor>> {
  return requisicao<Paginado<Fornecedor>>('/inventory/fornecedores/', {
    parametros: {
      page: filtros.pagina ?? 1,
      search: filtros.busca,
      apagados: booleanoTexto(filtros.apagados),
      ordering: 'nome',
    },
  });
}

export async function buscarFornecedor(id: number): Promise<Fornecedor> {
  return requisicao<Fornecedor>(`/inventory/fornecedores/${id}/`);
}

export async function criarFornecedor(dados: DadosFornecedor): Promise<Fornecedor> {
  return requisicao<Fornecedor>('/inventory/fornecedores/', { metodo: 'POST', corpo: dados });
}

export async function atualizarFornecedor(id: number, dados: DadosFornecedor): Promise<Fornecedor> {
  return requisicao<Fornecedor>(`/inventory/fornecedores/${id}/`, { metodo: 'PUT', corpo: dados });
}

export async function apagarFornecedor(id: number): Promise<void> {
  await requisicao<void>(`/inventory/fornecedores/${id}/`, { metodo: 'DELETE' });
}

export async function restaurarFornecedor(id: number): Promise<Fornecedor> {
  return requisicao<Fornecedor>(`/inventory/fornecedores/${id}/restaurar/`, { metodo: 'PATCH' });
}

export async function opcoesFornecedores(): Promise<{ valor: number; rotulo: string }[]> {
  const resposta = await listarFornecedores({ pagina: 1, apagados: false });
  const ordenados = [...resposta.results].sort(function (a, b) {
    return Number(b.favorito) - Number(a.favorito);
  });
  return ordenados.map(function (fornecedor) {
    return {
      valor: fornecedor.id,
      rotulo: fornecedor.favorito ? `★ ${fornecedor.nome}` : fornecedor.nome,
    };
  });
}

export async function listarCompras(filtros: { pagina?: number; fornecedorId?: number | null; status?: StatusCompra | null }): Promise<Paginado<Compra>> {
  return requisicao<Paginado<Compra>>('/inventory/compra-fornecedores/', {
    parametros: {
      page: filtros.pagina ?? 1,
      fornecedor_id: filtros.fornecedorId,
      status: filtros.status,
      ordering: '-compra_realizada_em',
    },
  });
}

export async function buscarCompra(id: number): Promise<Compra> {
  return requisicao<Compra>(`/inventory/compra-fornecedores/${id}/`);
}

export async function criarCompra(dados: DadosCompra): Promise<Compra> {
  return requisicao<Compra>('/inventory/compra-fornecedores/', { metodo: 'POST', corpo: dados });
}

export async function atualizarObservacaoCompra(id: number, observacao: string): Promise<Compra> {
  return requisicao<Compra>(`/inventory/compra-fornecedores/${id}/`, { metodo: 'PATCH', corpo: { observacao: observacao } });
}

export async function devolverCompra(id: number): Promise<Compra> {
  return requisicao<Compra>(`/inventory/compra-fornecedores/${id}/devolver/`, { metodo: 'POST' });
}

export type Vinculo = {
  id: number;
  fornecedor: number;
  materia_prima: MateriaPrima;
  custo_unitario_fornecedor: string;
  sku_materia_prima_fornecedor: string;
  apagado_em: string | null;
};

export async function listarVinculos(filtros: { pagina?: number; materiaPrimaId?: number | null; apagados?: boolean | null }): Promise<Paginado<Vinculo>> {
  return requisicao<Paginado<Vinculo>>('/inventory/vinculo-fornecedores/', {
    parametros: {
      page: filtros.pagina ?? 1,
      materia_prima_id: filtros.materiaPrimaId,
      apagados: booleanoTexto(filtros.apagados),
    },
  });
}

export async function buscarVinculo(id: number): Promise<Vinculo> {
  return requisicao<Vinculo>(`/inventory/vinculo-fornecedores/${id}/`);
}

export async function criarVinculo(dados: { fornecedor: number; materia_prima: number; custo_unitario_fornecedor: string; sku_materia_prima_fornecedor?: string }): Promise<Vinculo> {
  return requisicao<Vinculo>('/inventory/vinculo-fornecedores/', { metodo: 'POST', corpo: dados });
}

export async function atualizarVinculo(id: number, dados: { fornecedor: number; custo_unitario_fornecedor: string; sku_materia_prima_fornecedor: string }): Promise<Vinculo> {
  return requisicao<Vinculo>(`/inventory/vinculo-fornecedores/${id}/`, { metodo: 'PUT', corpo: dados });
}

export async function apagarVinculo(id: number): Promise<void> {
  await requisicao<void>(`/inventory/vinculo-fornecedores/${id}/`, { metodo: 'DELETE' });
}

export async function restaurarVinculo(id: number): Promise<void> {
  await requisicao<unknown>(`/inventory/vinculo-fornecedores/${id}/restaurar/`, { metodo: 'PATCH' });
}

export async function marcarFavorito(id: number, favorito: boolean): Promise<Fornecedor> {
  return requisicao<Fornecedor>(`/inventory/fornecedores/${id}/`, { metodo: 'PATCH', corpo: { favorito: favorito } });
}
