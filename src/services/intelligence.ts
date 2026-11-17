
import { requisicao } from './api';
import { listarFichasDaVariacao } from './estoque';

// Dados enviados para o Django
export interface DadosPrecificacao {
  peso_g: number;
  unidade: number;
  formato: string;
  tipo_sabonete: string;
  tipo_pele: string;
  embalagem: string;
  base_sabonete: string;
  tipo_vendedor: string;

  custo_unitario?: number;
  margem_desejada?: number;
}

// Resultado do Machine Learning
export interface PrevisaoPreco {
  preco_unitario_estimado: number;
  preco_total_estimado: number;
  faixa_minima: number;
  faixa_maxima: number;
}

// Resultado dos cálculos financeiros
export interface AnaliseFinanceira {
  custo_unitario: number;
  custo_total: number;
  receita_estimada: number;
  lucro_unitario: number;
  lucro_total: number;
  margem_lucro_percentual: number;
  lucro_positivo: boolean;
  margem_desejada_percentual?: number;
  preco_minimo_margem_desejada?: number;
}

// Resposta completa da API
export interface ResultadoPrecificacao {
  previsao: PrevisaoPreco;
  analise_financeira?: AnaliseFinanceira;
}

// Solicita uma previsão ao backend
export async function preverPreco(
  dados: DadosPrecificacao
): Promise<ResultadoPrecificacao> {

  const resposta = await requisicao<ResultadoPrecificacao | PrevisaoPreco>(
    '/intelligence/prever-preco/',
    {
      metodo: 'POST',
      corpo: dados,
      autenticado: true,
    }
  );

  if ('previsao' in resposta) {
    return resposta;
  }
  return { previsao: resposta };
}

export function analisarPreco(preco: number, custoUnitario: number, margemDesejada?: number): AnaliseFinanceira {
  const lucro = preco - custoUnitario;
  const analise: AnaliseFinanceira = {
    custo_unitario: custoUnitario,
    custo_total: custoUnitario,
    receita_estimada: preco,
    lucro_unitario: Math.round(lucro * 100) / 100,
    lucro_total: Math.round(lucro * 100) / 100,
    margem_lucro_percentual: preco > 0 ? Math.round((lucro / preco) * 10000) / 100 : 0,
    lucro_positivo: lucro > 0,
  };
  if (margemDesejada !== undefined && margemDesejada < 100) {
    analise.margem_desejada_percentual = margemDesejada;
    analise.preco_minimo_margem_desejada = Math.round((custoUnitario / (1 - margemDesejada / 100)) * 100) / 100;
  }
  return analise;
}

export const OPCOES_FORMATO = ['Barra', 'Barra Massageador', 'Decorativo'];

export const OPCOES_TIPO_SABONETE = ['Corporal', 'Corporal e Barba', 'Corporal e Facial', 'Corporal e Mão', 'Corporal p/ bebê', 'Esfoliante Corporal', 'Esfoliante Facial', 'Facial'];

export const OPCOES_TIPO_PELE = ['Todos os tipos', 'Acneica', 'Oleosa, Acneica', 'Sensível', 'Não informado'];

export const OPCOES_EMBALAGEM = ['Não informado', 'Nao possui', 'Caixa', 'Plastico', 'Saboneteira', 'Saco'];

export const OPCOES_BASE_SABONETE = ['Processo a frio', 'Glicerina', 'Base vegetal', 'Não informado'];

export const OPCOES_TIPO_VENDEDOR = ['Artesanal', 'Grande marca'];

export async function custoPelaFichaTecnica(variacaoId: number): Promise<number> {
  const fichas = await listarFichasDaVariacao(variacaoId);
  const custos = await Promise.all(
    fichas.map(function (ficha) {
      return requisicao<{ custo_unitario_referencia: string }>(`/inventory/materias-primas/${ficha.materia_prima.id}/`);
    })
  );
  return fichas.reduce(function (soma, ficha, indice) {
    return soma + Number(ficha.quantidade_necessaria) * Number(custos[indice].custo_unitario_referencia);
  }, 0);
}
