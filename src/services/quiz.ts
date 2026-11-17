import { requisicao, ErroApi } from './api';

export const ROTA_RECOMENDACAO = '/intelligence/recomendar-produto/';
export const ROTA_INGREDIENTES = '/intelligence/ingredientes/';

export type TipoPeleQuiz = 'seca' | 'oleosa' | 'mista' | 'normal' | 'nao_sei';
export type Frequencia = 'sim' | 'nao' | 'as_vezes';
export type Preferencia = 'hidratacao' | 'limpeza_suave' | 'cuidados_gerais' | 'fragrancia_suave';

export type RespostasQuiz = {
  tipo_pele: TipoPeleQuiz;
  sensibilidade: Frequencia;
  ressecamento: Frequencia;
  preferencia: Preferencia;
  evita_fragrancia: 0 | 1;
  quer_vegano: 0 | 1;
  alergia_ingrediente: (number | string)[];
};

export type OpcaoQuiz = {
  valor: string | number;
  rotulo: string;
};

export type PerguntaQuiz = {
  campo: keyof RespostasQuiz;
  titulo: string;
  ajuda: string;
  opcoes: OpcaoQuiz[];
  multipla?: boolean;
};

const SIM_NAO_AS_VEZES: OpcaoQuiz[] = [
  { valor: 'sim', rotulo: 'Sim' },
  { valor: 'nao', rotulo: 'Não' },
  { valor: 'as_vezes', rotulo: 'Às vezes' },
];

const SIM_NAO: OpcaoQuiz[] = [
  { valor: 1, rotulo: 'Sim' },
  { valor: 0, rotulo: 'Não' },
];

export const PERGUNTAS: PerguntaQuiz[] = [
  {
    campo: 'tipo_pele',
    titulo: 'Qual seu tipo de pele?',
    ajuda: 'Se ficar em dúvida, tudo bem escolher "Não sei".',
    opcoes: [
      { valor: 'seca', rotulo: 'Seca' },
      { valor: 'oleosa', rotulo: 'Oleosa' },
      { valor: 'mista', rotulo: 'Mista' },
      { valor: 'normal', rotulo: 'Normal' },
      { valor: 'nao_sei', rotulo: 'Não sei' },
    ],
  },
  { campo: 'sensibilidade', titulo: 'Sua pele é sensível?', ajuda: 'Fica vermelha ou arde com facilidade?', opcoes: SIM_NAO_AS_VEZES },
  { campo: 'ressecamento', titulo: 'Sente ressecamento?', ajuda: 'Aquela sensação de pele repuxando depois do banho.', opcoes: SIM_NAO_AS_VEZES },
  {
    campo: 'preferencia',
    titulo: 'O que mais busca?',
    ajuda: 'Escolha o que é mais importante para você.',
    opcoes: [
      { valor: 'hidratacao', rotulo: 'Hidratação' },
      { valor: 'limpeza_suave', rotulo: 'Limpeza suave' },
      { valor: 'cuidados_gerais', rotulo: 'Cuidados gerais' },
      { valor: 'fragrancia_suave', rotulo: 'Fragrância suave' },
    ],
  },
  { campo: 'evita_fragrancia', titulo: 'Prefere evitar fragrância?', ajuda: 'Sabonetes sem perfume adicionado.', opcoes: SIM_NAO },
  { campo: 'quer_vegano', titulo: 'Só produtos veganos?', ajuda: 'Sem nenhum ingrediente de origem animal.', opcoes: SIM_NAO },
  { campo: 'alergia_ingrediente', titulo: 'Tem alergia a algum ingrediente?', ajuda: 'Pode marcar vários, ou seguir sem marcar nenhum.', opcoes: [], multipla: true },
];

export type Recomendacao = {
  produtoId: number;
  variacaoId: number | null;
  motivo: string;
};

function numero(valor: unknown) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) && convertido > 0 ? convertido : null;
}

function lerRecomendacao(resposta: unknown): Recomendacao | null {
  if (!resposta || typeof resposta !== 'object') {
    return null;
  }
  const dados = resposta as Record<string, unknown>;
  const base = (dados.recomendacao && typeof dados.recomendacao === 'object' ? dados.recomendacao : dados) as Record<string, unknown>;
  const produto = base.produto && typeof base.produto === 'object' ? (base.produto as Record<string, unknown>).id : base.produto;
  const variacao = base.variacao && typeof base.variacao === 'object' ? (base.variacao as Record<string, unknown>).id : base.variacao;
  const produtoId = numero(base.produto_id ?? produto);
  if (produtoId === null) {
    return null;
  }
  const motivo = base.motivo ?? base.explicacao ?? base.justificativa ?? '';
  return {
    produtoId: produtoId,
    variacaoId: numero(base.variacao_id ?? variacao),
    motivo: typeof motivo === 'string' ? motivo : '',
  };
}

export async function recomendarProduto(respostas: RespostasQuiz): Promise<Recomendacao> {
  const resposta = await requisicao<unknown>(ROTA_RECOMENDACAO, { metodo: 'POST', corpo: respostas, autenticado: false });
  const recomendacao = lerRecomendacao(resposta);
  if (!recomendacao) {
    throw new ErroApi(422, 'recomendacao_invalida', 'O Bú não conseguiu escolher um sabonete com essas respostas.', null);
  }
  return recomendacao;
}

export async function listarIngredientes(): Promise<OpcaoQuiz[]> {
  const resposta = await requisicao<unknown>(ROTA_INGREDIENTES, { autenticado: false });
  const lista = Array.isArray(resposta) ? resposta : resposta && typeof resposta === 'object' && Array.isArray((resposta as Record<string, unknown>).results) ? ((resposta as Record<string, unknown>).results as unknown[]) : [];
  return lista
    .map(function (item): OpcaoQuiz | null {
      if (typeof item === 'string') {
        return { valor: item, rotulo: item };
      }
      if (item && typeof item === 'object') {
        const dados = item as Record<string, unknown>;
        const nome = dados.nome ?? dados.name;
        if (typeof nome === 'string') {
          return { valor: typeof dados.id === 'number' ? dados.id : nome, rotulo: nome };
        }
      }
      return null;
    })
    .filter(function (opcao): opcao is OpcaoQuiz {
      return opcao !== null;
    });
}

export function recomendacaoIndisponivel(erro: unknown) {
  return erro instanceof ErroApi && [404, 405, 501, 503].includes(erro.status);
}

export function textoDaResposta(campo: keyof RespostasQuiz, valor: string | number) {
  const pergunta = PERGUNTAS.find(function (item) {
    return item.campo === campo;
  });
  const opcao = pergunta ? pergunta.opcoes.find(function (item) {
    return item.valor === valor;
  }) : undefined;
  return opcao ? opcao.rotulo : String(valor);
}
