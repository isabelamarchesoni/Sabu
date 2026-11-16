import { requisicao, type Paginado } from './api';

export type Cliente = {
  id: number;
  nome: string;
  telefone: string;
  cpf_cnpj: string | null;
  ultimo_pedido_em: string | null;
  criado_em: string;
};

export type DadosCliente = {
  nome: string;
  telefone: string;
  cpf_cnpj: string | null;
};

export type StatusPedido = 'PENDENTE' | 'CONCLUIDO' | 'CANCELADO' | 'ESTORNADO_COM_DEVOLUCAO' | 'ESTORNADO_SEM_DEVOLUCAO';

export type ItemPedido = {
  id: number;
  variacao: number;
  quantidade_item: number;
  valor_unitario: string;
};

export type Pedido = {
  id: number;
  cliente: number | null;
  cep: string;
  numero_residencia: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  sigla_estado: string;
  status: StatusPedido;
  valor_total: string;
  observacao: string;
  criado_em: string;
  atualizado_em: string;
  itens: ItemPedido[];
};

export const STATUS_PEDIDO: StatusPedido[] = ['PENDENTE', 'CONCLUIDO', 'CANCELADO', 'ESTORNADO_COM_DEVOLUCAO', 'ESTORNADO_SEM_DEVOLUCAO'];

export const SITUACOES_PEDIDO: Record<StatusPedido, { texto: string; tom: 'alerta' | 'sucesso' | 'neutro' | 'erro' }> = {
  PENDENTE: { texto: 'Pendente', tom: 'alerta' },
  CONCLUIDO: { texto: 'Concluído', tom: 'sucesso' },
  CANCELADO: { texto: 'Cancelado', tom: 'neutro' },
  ESTORNADO_COM_DEVOLUCAO: { texto: 'Estornado (com devolução)', tom: 'erro' },
  ESTORNADO_SEM_DEVOLUCAO: { texto: 'Estornado (sem devolução)', tom: 'erro' },
};

type FiltrosClientes = {
  pagina?: number;
  busca?: string;
  ordenacao?: string;
};

type FiltrosPedidos = {
  pagina?: number;
  clienteId?: number | null;
  status?: StatusPedido | null;
  criadoDe?: string;
  criadoAte?: string;
  valorMin?: string;
  valorMax?: string;
  ordenacao?: string;
};

export async function listarClientes(filtros: FiltrosClientes): Promise<Paginado<Cliente>> {
  return requisicao<Paginado<Cliente>>('/orders/clientes/', {
    parametros: {
      page: filtros.pagina ?? 1,
      search: filtros.busca,
      ordering: filtros.ordenacao,
    },
  });
}

export async function buscarCliente(id: number): Promise<Cliente> {
  return requisicao<Cliente>(`/orders/clientes/${id}/`);
}

export async function salvarCliente(id: number | null, dados: DadosCliente): Promise<Cliente> {
  if (id === null) {
    return requisicao<Cliente>('/orders/clientes/', { metodo: 'POST', corpo: dados });
  }
  return requisicao<Cliente>(`/orders/clientes/${id}/`, { metodo: 'PUT', corpo: dados });
}

export async function apagarCliente(id: number) {
  await requisicao<void>(`/orders/clientes/${id}/`, { metodo: 'DELETE' });
}

export async function listarPedidos(filtros: FiltrosPedidos): Promise<Paginado<Pedido>> {
  return requisicao<Paginado<Pedido>>('/orders/pedidos/', {
    parametros: {
      page: filtros.pagina ?? 1,
      cliente_id: filtros.clienteId,
      status: filtros.status ?? undefined,
      criado_de: filtros.criadoDe,
      criado_ate: filtros.criadoAte,
      valor_min: filtros.valorMin,
      valor_max: filtros.valorMax,
      ordering: filtros.ordenacao,
    },
  });
}

export async function buscarPedido(id: number): Promise<Pedido> {
  return requisicao<Pedido>(`/orders/pedidos/${id}/`);
}

export async function concluirPedido(id: number) {
  await requisicao<unknown>(`/orders/pedidos/${id}/concluir/`, { metodo: 'POST' });
}

export async function cancelarPedido(id: number) {
  await requisicao<unknown>(`/orders/pedidos/${id}/cancelar/`, { metodo: 'POST' });
}

export async function estornarPedido(id: number, comDevolucao: boolean) {
  const acao = comDevolucao ? 'estornar_com_devolucao' : 'estornar_sem_devolucao';
  await requisicao<unknown>(`/orders/pedidos/${id}/${acao}/`, { metodo: 'POST' });
}