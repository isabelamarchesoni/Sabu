
import { requisicao } from './api';

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
