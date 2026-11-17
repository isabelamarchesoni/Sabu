import { requisicao, type Paginado } from './api';

export type MateriaPrimaResumo = {
  id: number;
  sku: string;
  nome: string;
  unidade_medida: string;
  quantidade_estoque: string;
};

export type FichaTecnica = {
  id: number;
  variacao: number;
  materia_prima: MateriaPrimaResumo;
  quantidade_necessaria: string;
  apagada_em: string | null;
};

export type StatusLote = 'ATIVO' | 'ESGOTADO' | 'VENCIDO';

export const SITUACOES_LOTE: Record<StatusLote, { texto: string; tom: 'sucesso' | 'neutro' | 'erro' }> = {
  ATIVO: { texto: 'Ativo', tom: 'sucesso' },
  ESGOTADO: { texto: 'Esgotado', tom: 'neutro' },
  VENCIDO: { texto: 'Vencido', tom: 'erro' },
};

export type LoteVariacao = {
  id: number;
  variacao: number;
  sku: string;
  variacao_nome: string;
  produto_nome: string;
  numero_lote: string;
  data_fabricacao: string | null;
  data_validade: string;
  quantidade_inicial: number;
  quantidade_atual: number;
  status: StatusLote;
  observacao: string;
  criado_em: string;
};

export type TipoMateriaPrima = 'OLEOS_E_GORDURAS' | 'AGENTES_SAPONIFICANTES' | 'LIQUIDOS_DILUICAO' | 'AROMAS_E_FRAGANCIAS' | 'CORANTES_E_PIGMENTOS' | 'ADITIVOS_E_ATIVOS' | 'EMBALAGENS_E_ROTULOS' | 'MATERIAL_DE_APOIO';

export type UnidadeMedida = 'KG' | 'G' | 'MG' | 'L' | 'ML' | 'UN';

export const TIPOS_MATERIA_PRIMA: { valor: TipoMateriaPrima; rotulo: string }[] = [
  { valor: 'OLEOS_E_GORDURAS', rotulo: 'Óleos e gorduras' },
  { valor: 'AGENTES_SAPONIFICANTES', rotulo: 'Agentes saponificantes' },
  { valor: 'LIQUIDOS_DILUICAO', rotulo: 'Líquidos de diluição' },
  { valor: 'AROMAS_E_FRAGANCIAS', rotulo: 'Aromas e fragrâncias' },
  { valor: 'CORANTES_E_PIGMENTOS', rotulo: 'Corantes e pigmentos' },
  { valor: 'ADITIVOS_E_ATIVOS', rotulo: 'Aditivos e ativos' },
  { valor: 'EMBALAGENS_E_ROTULOS', rotulo: 'Embalagens e rótulos' },
  { valor: 'MATERIAL_DE_APOIO', rotulo: 'Material de apoio' },
];

export const UNIDADES_MEDIDA: { valor: UnidadeMedida; rotulo: string }[] = [
  { valor: 'KG', rotulo: 'Quilograma (kg)' },
  { valor: 'G', rotulo: 'Grama (g)' },
  { valor: 'MG', rotulo: 'Miligrama (mg)' },
  { valor: 'L', rotulo: 'Litro (l)' },
  { valor: 'ML', rotulo: 'Mililitro (ml)' },
  { valor: 'UN', rotulo: 'Unidade (un)' },
];

export type MateriaPrima = {
  id: number;
  sku: string;
  nome: string;
  tipo: TipoMateriaPrima;
  unidade_medida: UnidadeMedida;
  quantidade_estoque: string;
  custo_unitario_referencia: string;
  apagada_em: string | null;
};

export type DadosMateriaPrima = {
  sku: string;
  nome: string;
  tipo: TipoMateriaPrima;
  unidade_medida: UnidadeMedida;
  custo_unitario_referencia: string;
};

export type LoteMateriaPrima = {
  id: number;
  materia_prima: number;
  sku: string;
  materia_prima_nome: string;
  compra_fornecedor_item: number | null;
  numero_lote_fabricante: string;
  quantidade_inicial: string;
  quantidade_atual: string;
  status: StatusLote;
  data_validade: string | null;
  observacao: string;
  criado_em: string;
};

export function rotuloTipo(tipo: string) {
  const encontrado = TIPOS_MATERIA_PRIMA.find(function (item) {
    return item.valor === tipo;
  });
  return encontrado ? encontrado.rotulo : tipo;
}

export function formatarQuantidade(valor: string | number) {
  const numero = typeof valor === 'number' ? valor : Number(valor);
  return (Number.isNaN(numero) ? 0 : numero).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

export function formatarCusto(valor: string | number) {
  const numero = typeof valor === 'number' ? valor : Number(valor);
  return `R$ ${(Number.isNaN(numero) ? 0 : numero).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

export function booleanoTexto(valor: boolean | null | undefined) {
  if (valor === null || valor === undefined) {
    return undefined;
  }
  return valor ? 'true' : 'false';
}

export async function listarMateriasPrimas(filtros: { pagina?: number; busca?: string; apagadas?: boolean | null }): Promise<Paginado<MateriaPrima>> {
  return requisicao<Paginado<MateriaPrima>>('/inventory/materias-primas/', {
    parametros: {
      page: filtros.pagina ?? 1,
      search: filtros.busca,
      apagadas: booleanoTexto(filtros.apagadas),
      ordering: 'nome',
    },
  });
}

export async function buscarMateriaPrima(id: number): Promise<MateriaPrima> {
  return requisicao<MateriaPrima>(`/inventory/materias-primas/${id}/`);
}

export async function salvarMateriaPrima(id: number | null, dados: DadosMateriaPrima): Promise<MateriaPrima> {
  if (id === null) {
    return requisicao<MateriaPrima>('/inventory/materias-primas/', { metodo: 'POST', corpo: dados });
  }
  return requisicao<MateriaPrima>(`/inventory/materias-primas/${id}/`, { metodo: 'PUT', corpo: dados });
}

export async function apagarMateriaPrima(id: number) {
  await requisicao<void>(`/inventory/materias-primas/${id}/`, { metodo: 'DELETE' });
}

export async function restaurarMateriaPrima(id: number) {
  await requisicao<unknown>(`/inventory/materias-primas/${id}/restaurar/`, { metodo: 'PATCH' });
}

export async function listarLotesDaMateriaPrima(materiaPrimaId: number): Promise<LoteMateriaPrima[]> {
  const resposta = await requisicao<Paginado<LoteMateriaPrima>>('/inventory/lotes-materia-prima/', {
    parametros: {
      materia_prima_id: materiaPrimaId,
      ordering: '-criado_em',
    },
  });
  return resposta.results;
}

export async function listarFichasDaVariacao(variacaoId: number): Promise<FichaTecnica[]> {
  const resposta = await requisicao<Paginado<FichaTecnica>>('/inventory/fichas-tecnicas/', {
    parametros: {
      variacao_id: variacaoId,
      apagadas: 'false',
    },
  });
  return resposta.results;
}

export async function listarFichas(filtros: { pagina?: number; variacaoId?: number | null; apagadas?: boolean | null }): Promise<Paginado<FichaTecnica>> {
  return requisicao<Paginado<FichaTecnica>>('/inventory/fichas-tecnicas/', {
    parametros: {
      page: filtros.pagina ?? 1,
      variacao_id: filtros.variacaoId,
      apagadas: booleanoTexto(filtros.apagadas),
    },
  });
}

export async function buscarFicha(id: number): Promise<FichaTecnica> {
  return requisicao<FichaTecnica>(`/inventory/fichas-tecnicas/${id}/`);
}

export async function criarFicha(dados: { variacao: number; materia_prima: number; quantidade_necessaria: string }): Promise<FichaTecnica> {
  return requisicao<FichaTecnica>('/inventory/fichas-tecnicas/', { metodo: 'POST', corpo: dados });
}

export async function atualizarFicha(id: number, dados: { materia_prima: number; quantidade_necessaria: string }): Promise<FichaTecnica> {
  return requisicao<FichaTecnica>(`/inventory/fichas-tecnicas/${id}/`, { metodo: 'PUT', corpo: dados });
}

export async function apagarFicha(id: number) {
  await requisicao<void>(`/inventory/fichas-tecnicas/${id}/`, { metodo: 'DELETE' });
}

export async function restaurarFicha(id: number) {
  await requisicao<unknown>(`/inventory/fichas-tecnicas/${id}/restaurar/`, { metodo: 'PATCH' });
}

export async function listarLotesDaVariacao(variacaoId: number): Promise<LoteVariacao[]> {
  const resposta = await requisicao<Paginado<LoteVariacao>>('/inventory/lotes-variacao/', {
    parametros: {
      variacao_id: variacaoId,
      ordering: '-criado_em',
    },
  });
  return resposta.results;
}

export type TipoMovimentacaoMaterial = 'ENTRADA' | 'SAIDA_PRODUCAO' | 'AJUSTE_OU_PERDA' | 'SAIDA_DEVOLUCAO';

export type TipoMovimentacaoEstoque = 'ENTRADA' | 'SAIDA_VENDA' | 'AJUSTE_OU_PERDA' | 'ESTORNO_VENDA';

export const TIPOS_MOVIMENTACAO: Record<TipoMovimentacaoMaterial | TipoMovimentacaoEstoque, { texto: string; tom: 'sucesso' | 'alerta' | 'erro' | 'neutro'; sinal: '+' | '−' }> = {
  ENTRADA: { texto: 'Entrada', tom: 'sucesso', sinal: '+' },
  SAIDA_PRODUCAO: { texto: 'Saída por produção', tom: 'neutro', sinal: '−' },
  SAIDA_VENDA: { texto: 'Saída por venda', tom: 'neutro', sinal: '−' },
  AJUSTE_OU_PERDA: { texto: 'Ajuste / perda', tom: 'erro', sinal: '−' },
  SAIDA_DEVOLUCAO: { texto: 'Devolução', tom: 'alerta', sinal: '−' },
  ESTORNO_VENDA: { texto: 'Estorno de venda', tom: 'alerta', sinal: '+' },
};

export const TIPOS_MANUAIS: { valor: 'ENTRADA' | 'AJUSTE_OU_PERDA'; rotulo: string }[] = [
  { valor: 'ENTRADA', rotulo: 'Entrada (soma ao lote)' },
  { valor: 'AJUSTE_OU_PERDA', rotulo: 'Ajuste ou perda (tira do lote)' },
];

export type MovimentacaoMaterial = {
  id: number;
  lote_materia_prima: number;
  numero_lote_fabricante: string;
  sku: string;
  materia_prima: number;
  materia_prima_nome: string;
  fornecedor: number | null;
  fornecedor_nome: string;
  tipo: TipoMovimentacaoMaterial;
  quantidade_movimentada: string;
  observacao: string;
  movimentado_em: string;
};

export type MovimentacaoEstoque = {
  id: number;
  lote_produto_variacao: number;
  numero_lote: string;
  sku: string;
  variacao: number;
  variacao_nome: string;
  produto_nome: string;
  usuario: number | null;
  pedido: number | null;
  tipo: TipoMovimentacaoEstoque;
  quantidade_movimentada: number;
  observacao: string;
  movimentado_em: string;
};

export async function listarLotesMateriaPrima(filtros: { pagina?: number; busca?: string; materiaPrimaId?: number | null; status?: StatusLote | null }): Promise<Paginado<LoteMateriaPrima>> {
  return requisicao<Paginado<LoteMateriaPrima>>('/inventory/lotes-materia-prima/', {
    parametros: {
      page: filtros.pagina ?? 1,
      search: filtros.busca,
      materia_prima_id: filtros.materiaPrimaId,
      status: filtros.status,
      ordering: '-criado_em',
    },
  });
}

export async function buscarLoteMateriaPrima(id: number): Promise<LoteMateriaPrima> {
  return requisicao<LoteMateriaPrima>(`/inventory/lotes-materia-prima/${id}/`);
}

export async function criarLoteMateriaPrima(dados: { materia_prima: number; numero_lote_fabricante?: string; data_validade?: string; observacao?: string }): Promise<LoteMateriaPrima> {
  return requisicao<LoteMateriaPrima>('/inventory/lotes-materia-prima/', { metodo: 'POST', corpo: dados });
}

export async function listarLotesVariacao(filtros: { pagina?: number; busca?: string; variacaoId?: number | null; status?: StatusLote | null }): Promise<Paginado<LoteVariacao>> {
  return requisicao<Paginado<LoteVariacao>>('/inventory/lotes-variacao/', {
    parametros: {
      page: filtros.pagina ?? 1,
      search: filtros.busca,
      variacao_id: filtros.variacaoId,
      status: filtros.status,
      ordering: '-criado_em',
    },
  });
}

export async function buscarLoteVariacao(id: number): Promise<LoteVariacao> {
  return requisicao<LoteVariacao>(`/inventory/lotes-variacao/${id}/`);
}

export async function criarLoteVariacao(dados: { variacao: number; data_validade: string; numero_lote?: string; data_fabricacao?: string; observacao?: string }): Promise<LoteVariacao> {
  return requisicao<LoteVariacao>('/inventory/lotes-variacao/', { metodo: 'POST', corpo: dados });
}

export async function listarMovimentacoesMaterial(filtros: { pagina?: number; busca?: string; materiaPrimaId?: number | null; loteId?: number | null }): Promise<Paginado<MovimentacaoMaterial>> {
  return requisicao<Paginado<MovimentacaoMaterial>>('/inventory/movimentacoes-material/', {
    parametros: {
      page: filtros.pagina ?? 1,
      search: filtros.busca,
      materia_prima_id: filtros.materiaPrimaId,
      lote_materia_prima_id: filtros.loteId,
      ordering: '-movimentado_em',
    },
  });
}

export async function criarMovimentacaoMaterial(dados: { lote_materia_prima: number; tipo: 'ENTRADA' | 'AJUSTE_OU_PERDA'; quantidade_movimentada: string; fornecedor?: number; observacao?: string }): Promise<MovimentacaoMaterial> {
  return requisicao<MovimentacaoMaterial>('/inventory/movimentacoes-material/', { metodo: 'POST', corpo: dados });
}

export async function listarMovimentacoesEstoque(filtros: { pagina?: number; busca?: string; variacaoId?: number | null; loteId?: number | null }): Promise<Paginado<MovimentacaoEstoque>> {
  return requisicao<Paginado<MovimentacaoEstoque>>('/inventory/movimentacoes-estoque/', {
    parametros: {
      page: filtros.pagina ?? 1,
      search: filtros.busca,
      variacao_id: filtros.variacaoId,
      lote_produto_variacao_id: filtros.loteId,
      ordering: '-movimentado_em',
    },
  });
}

export async function criarMovimentacaoEstoque(dados: { lote_produto_variacao: number; tipo: 'ENTRADA' | 'AJUSTE_OU_PERDA'; quantidade_movimentada: number; observacao?: string }): Promise<MovimentacaoEstoque> {
  return requisicao<MovimentacaoEstoque>('/inventory/movimentacoes-estoque/', { metodo: 'POST', corpo: dados });
}
