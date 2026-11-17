import { listarProdutosAdmin } from './catalogo';
import { listarVariacoes } from './variacoes';
import { listarMateriasPrimas, type UnidadeMedida } from './estoque';

export type OpcaoVariacao = {
  valor: number;
  rotulo: string;
  sku: string;
  estoque: number;
};

export type OpcaoMateriaPrima = {
  valor: number;
  rotulo: string;
  unidade: UnidadeMedida;
  custo: string;
};

export async function opcoesVariacoes(): Promise<OpcaoVariacao[]> {
  const [variacoes, produtos] = await Promise.all([listarVariacoes({ pagina: 1, apagadas: false }), listarProdutosAdmin({ pagina: 1 })]);
  const nomes: Record<number, string> = {};
  produtos.results.forEach(function (produto) {
    nomes[produto.id] = produto.nome;
  });
  return variacoes.results.map(function (variacao) {
    const produto = nomes[variacao.produto];
    return {
      valor: variacao.id,
      rotulo: `${produto ? `${produto} ` : ''}${variacao.nome} · ${variacao.sku}`,
      sku: variacao.sku,
      estoque: variacao.quantidade_estoque,
    };
  });
}

export async function opcoesMateriasPrimas(): Promise<OpcaoMateriaPrima[]> {
  const resposta = await listarMateriasPrimas({ pagina: 1, apagadas: false });
  return resposta.results.map(function (materia) {
    return {
      valor: materia.id,
      rotulo: `${materia.nome} · ${materia.sku} (${materia.unidade_medida.toLowerCase()})`,
      unidade: materia.unidade_medida,
      custo: materia.custo_unitario_referencia,
    };
  });
}
