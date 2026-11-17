import { formatarDinheiro, paraNumero, precoAtual, promocaoAtiva } from './formatar';
import type { Produto, Variacao } from '../services/catalogo';

export const LINHA = '---------------------------------------';

function detalheVariacao(variacao: Variacao) {
  return variacao.peso_gramas ? `${variacao.nome} · ${variacao.peso_gramas} g` : variacao.nome;
}

export function mensagemPedidoVitrine(produto: Produto, variacao: Variacao, quantidade: number) {
  const unitario = precoAtual(variacao);
  const linhas = [
    '🧼 *QUERO FAZER UM PEDIDO NA SABU* 🐸',
    '_feito pra cuidar de tu_',
    '',
    LINHA,
    'Confira o meu pedido:',
    LINHA,
    '',
    `*${quantidade}x ${produto.nome}*`,
    `_${detalheVariacao(variacao)}_`,
    `${formatarDinheiro(unitario)} cada`,
  ];
  if (promocaoAtiva(variacao)) {
    linhas.push(`🏷️ Em promoção (de ${formatarDinheiro(variacao.preco)})`);
  }
  linhas.push('', LINHA, `*Total: ${formatarDinheiro(paraNumero(unitario) * quantidade)}*`, '_Entrega e pagamento a combinar_', LINHA, '', 'Pode me dizer como fica a entrega e as formas de pagamento? 💚');
  return linhas.join('\n');
}

export type ResumoQuiz = {
  pergunta: string;
  resposta: string;
}[];

export function mensagemQuiz(produto: Produto, variacao: Variacao | undefined, resumo: ResumoQuiz) {
  const linhas = ['🐸 *FIZ O QUIZ DO BÚ!* 💚', '_feito pra cuidar de tu_', '', LINHA, 'O Bú me recomendou:', `*${produto.nome}*`];
  if (variacao) {
    linhas.push(`_${detalheVariacao(variacao)}_ · ${formatarDinheiro(precoAtual(variacao))}`);
  }
  linhas.push(LINHA, '*Minhas respostas*');
  resumo.forEach(function (item) {
    linhas.push(`• ${item.pergunta}: ${item.resposta}`);
  });
  linhas.push(LINHA, '', 'Quero saber mais sobre esse sabonete! Ele combina comigo? 🧼');
  return linhas.join('\n');
}
