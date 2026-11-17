import { requisicao, ErroApi, type Paginado } from './api';

export const ROTA_RECOMENDACAO = '/recommendations/quiz/';
export const ROTA_INGREDIENTES = '/catalog/ingredientes/';

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

export type ProdutoRecomendado = {
  id: number;
  nome: string;
  imagem: string | null;
  tipo_pele_indicado: string;
  base: string;
  essencia: string;
  prob: number;
};

export type RespostaRecomendacao = {
  produtos: ProdutoRecomendado[];
  aviso: string;
};

export type Recomendacao = {
  produtoId: number;
  aviso: string;
};

type Ingrediente = {
  id: number;
  nome: string;
};

// O backend devolve até 3 produtos, do mais compatível para o menos. Lista vazia: nenhum sabonete passou nas regras.
export async function recomendarProduto(respostas: RespostasQuiz): Promise<Recomendacao | null> {
  const resposta = await requisicao<RespostaRecomendacao>(ROTA_RECOMENDACAO, { metodo: 'POST', corpo: respostas, autenticado: false });
  const primeiro = resposta.produtos[0];
  return primeiro ? { produtoId: primeiro.id, aviso: resposta.aviso } : null;
}

// A alergia é enviada pelo nome do ingrediente, que é o que o backend valida.
// A rota é paginada (25 por página); por enquanto só a primeira página é usada.
export async function listarIngredientes(): Promise<OpcaoQuiz[]> {
  const resposta = await requisicao<Paginado<Ingrediente>>(ROTA_INGREDIENTES, { autenticado: false });
  return resposta.results.map(function (item) {
    return { valor: item.nome, rotulo: item.nome };
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
