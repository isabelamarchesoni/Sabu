
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

  return requisicao<ResultadoPrecificacao>(
    '/intelligence/prever-preco/',
    {
      metodo: 'POST',
      corpo: dados,
      autenticado: true,
    }
  );
}

export const OPCOES_FORMATO = ['Barra', 'Líquido', 'Pastoso'];

export const OPCOES_TIPO_SABONETE = ['Corporal', 'Facial', 'Íntimo', 'Infantil'];

export const OPCOES_TIPO_PELE = ['Todos os tipos', 'Normal', 'Seca', 'Oleosa', 'Mista', 'Sensível'];

export const OPCOES_EMBALAGEM = ['Não informado', 'Sem embalagem', 'Papel', 'Caixa', 'Plástico', 'Vidro'];

export const OPCOES_BASE_SABONETE = ['Processo a frio', 'Glicerina', 'Base vegetal'];

export const OPCOES_TIPO_VENDEDOR = ['Artesanal', 'Industrial'];

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
