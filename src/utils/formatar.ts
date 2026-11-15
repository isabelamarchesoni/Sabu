import type { Produto, Variacao } from '../services/catalogo';

export function paraNumero(valor: string | number | null | undefined) {
  if (valor === null || valor === undefined || valor === '') {
    return 0;
  }
  return typeof valor === 'number' ? valor : Number(valor);
}

export function formatarDinheiro(valor: string | number | null | undefined) {
  return paraNumero(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function promocaoAtiva(variacao: Variacao) {
  if (!variacao.preco_promo) {
    return false;
  }
  const agora = new Date();
  if (variacao.inicio_promo && new Date(variacao.inicio_promo) > agora) {
    return false;
  }
  if (variacao.fim_promo && new Date(variacao.fim_promo) < agora) {
    return false;
  }
  return true;
}

export function precoAtual(variacao: Variacao) {
  return promocaoAtiva(variacao) ? paraNumero(variacao.preco_promo) : paraNumero(variacao.preco);
}

export function variacoesDisponiveis(produto: Produto) {
  return produto.variacoes.filter(function (variacao) {
    return variacao.apagado_em === null;
  });
}

export function menorPreco(produto: Produto) {
  const lista = variacoesDisponiveis(produto);
  if (lista.length === 0) {
    return null;
  }
  let menor = lista[0];
  for (const variacao of lista) {
    if (precoAtual(variacao) < precoAtual(menor)) {
      menor = variacao;
    }
  }
  return menor;
}

export function estoqueTotal(produto: Produto) {
  return variacoesDisponiveis(produto).reduce(function (soma, variacao) {
    return soma + variacao.quantidade_estoque;
  }, 0);
}