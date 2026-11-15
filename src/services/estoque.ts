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

export async function listarFichasDaVariacao(variacaoId: number): Promise<FichaTecnica[]> {
  const resposta = await requisicao<Paginado<FichaTecnica>>('/inventory/fichas-tecnicas/', {
    parametros: {
      variacao_id: variacaoId,
      apagadas: 'false',
    },
  });
  return resposta.results;
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