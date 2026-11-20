import { requisicao } from './api';

export type ResumoPainel = {
  pedidosPendentes: number;
  lotesMateriaVencidos: number;
  lotesSabonetesVencidos: number;
  atualizadoEm: string;
};

type ResumoApi = {
  pedidos_pendentes: number;
  lotes_materia_prima_vencidos: number;
  lotes_produto_vencidos: number;
  atualizado_em: string;
};

export async function carregarResumo(): Promise<ResumoPainel> {
  const dados = await requisicao<ResumoApi>('/dashboard/resumo/');
  return {
    pedidosPendentes: dados.pedidos_pendentes,
    lotesMateriaVencidos: dados.lotes_materia_prima_vencidos,
    lotesSabonetesVencidos: dados.lotes_produto_vencidos,
    atualizadoEm: dados.atualizado_em,
  };
}