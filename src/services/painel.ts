import { requisicao, type Paginado } from './api';

export type ResumoPainel = { pedidosPendentes: number; lotesMateriaVencidos: number; lotesSabonetesVencidos: number };

async function contar(caminho: string, status: string) {
  const resposta = await requisicao<Paginado<unknown>>(caminho, { parametros: { status: status, page: 1 } });
  return resposta.count;
}

export async function carregarResumo(): Promise<ResumoPainel> {
  const [pedidosPendentes, lotesMateriaVencidos, lotesSabonetesVencidos] = await Promise.all([contar('/orders/pedidos/', 'PENDENTE'), contar('/inventory/lotes-materia-prima/', 'VENCIDO'), contar('/inventory/lotes-variacao/', 'VENCIDO')]);
  return { pedidosPendentes: pedidosPendentes, lotesMateriaVencidos: lotesMateriaVencidos, lotesSabonetesVencidos: lotesSabonetesVencidos };
}