import type { Pedido, TipoDesconto } from '../services/vendas';
import { formatarDinheiro } from './formatar';

export type LinhaDesconto = {
  variacaoId: number;
  totalCentavos: number;
};

const CEM_POR_CENTO = 10000;

export function paraCentavos(valor: string | number | null | undefined): number {
  if (valor === null || valor === undefined || valor === '') {
    return 0;
  }
  if (typeof valor === 'number') {
    return Math.round(valor * 100);
  }
  const texto = valor.trim();
  const partes = /^(-?)(\d+)(?:\.(\d+))?$/.exec(texto);
  if (!partes) {
    return Math.round((Number(texto) || 0) * 100);
  }
  const sinal = partes[1] === '-' ? -1 : 1;
  const inteiro = parseInt(partes[2], 10);
  const fracao = parseInt(((partes[3] ?? '') + '00').slice(0, 2), 10);
  return sinal * (inteiro * 100 + fracao);
}

export function centavosParaDecimal(centavos: number): string {
  const resto = centavos % 100;
  return `${Math.floor(centavos / 100)}.${String(resto).padStart(2, '0')}`;
}

export function formatarCentavos(centavos: number): string {
  return formatarDinheiro(centavos / 100);
}

export function moedaParaCentavos(texto: string): number {
  return parseInt(texto.replace(/\D/g, ''), 10) || 0;
}

export function percentualParaBp(texto: string): number {
  const [inteiro = '', fracao = ''] = texto.replace(/[^\d,]/g, '').split(',');
  return (parseInt(inteiro, 10) || 0) * 100 + (parseInt((fracao + '00').slice(0, 2), 10) || 0);
}

export function formatarPercentual(valor: string | number | null | undefined): string {
  const numero = typeof valor === 'number' ? valor : Number(valor ?? 0) || 0;
  return numero.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%';
}

export function calcularValorDesconto(tipo: TipoDesconto, valor: number, subtotalCentavos: number): number {
  if (valor <= 0 || subtotalCentavos <= 0) {
    return 0;
  }
  const bruto = tipo === 'FIXO' ? valor : Math.floor((subtotalCentavos * valor + CEM_POR_CENTO / 2) / CEM_POR_CENTO);
  return Math.min(bruto, subtotalCentavos);
}

export function distribuirDesconto(valorDescontoCentavos: number, linhas: LinhaDesconto[]): number[] {
  const alocado = linhas.map(function () {
    return 0;
  });
  const ordem = linhas
    .map(function (_, indice) {
      return indice;
    })
    .sort(function (a, b) {
      return linhas[a].variacaoId - linhas[b].variacaoId || a - b;
    });

  let restante = Math.max(0, Math.floor(valorDescontoCentavos));
  let abertos = ordem.filter(function (i) {
    return linhas[i].totalCentavos > 0;
  });

  while (restante > 0 && abertos.length > 0) {
    const base = Math.floor(restante / abertos.length);
    const sobra = restante % abertos.length;
    abertos.forEach(function (i, pos) {
      const cota = base + (pos < sobra ? 1 : 0);
      const dar = Math.min(cota, linhas[i].totalCentavos - alocado[i]);
      alocado[i] += dar;
      restante -= dar;
    });
    abertos = abertos.filter(function (i) {
      return alocado[i] < linhas[i].totalCentavos;
    });
  }
  return alocado;
}

export function validarDesconto(tipo: TipoDesconto | '', texto: string, subtotalCentavos: number): string {
  if (!tipo) {
    return '';
  }
  if (tipo === 'FIXO') {
    const valor = moedaParaCentavos(texto);
    if (valor > subtotalCentavos) {
      return `O desconto fixo (${formatarCentavos(valor)}) não pode ser maior que o subtotal do pedido (${formatarCentavos(subtotalCentavos)}).`;
    }
    return '';
  }
  if (percentualParaBp(texto) > CEM_POR_CENTO) {
    return 'O desconto percentual não pode ser maior que 100%.';
  }
  return '';
}

export function montarPayloadDesconto(tipo: TipoDesconto | '', texto: string): { tipo_desconto?: TipoDesconto; desconto?: string } {
  if (!tipo) {
    return {};
  }
  const valor = tipo === 'FIXO' ? moedaParaCentavos(texto) : percentualParaBp(texto);
  if (valor <= 0) {
    return {};
  }
  return { tipo_desconto: tipo, desconto: centavosParaDecimal(valor) };
}

export type PreviaDesconto = {
  subtotal: number;
  valorDesconto: number;
  total: number;
  porLinha: number[];
  erro: string;
};

export function resumirDesconto(tipo: TipoDesconto | '', texto: string, linhas: LinhaDesconto[]): PreviaDesconto {
  const subtotal = linhas.reduce(function (soma, linha) {
    return soma + linha.totalCentavos;
  }, 0);
  const erro = validarDesconto(tipo, texto, subtotal);
  let valorDesconto = 0;
  if (tipo && !erro) {
    const informado = tipo === 'FIXO' ? moedaParaCentavos(texto) : percentualParaBp(texto);
    valorDesconto = calcularValorDesconto(tipo, informado, subtotal);
  }
  return {
    subtotal,
    valorDesconto,
    total: subtotal - valorDesconto,
    porLinha: distribuirDesconto(valorDesconto, linhas),
    erro,
  };
}

export function pedidoTemDesconto(pedido: Pick<Pedido, 'valor_desconto'>): boolean {
  return paraCentavos(pedido.valor_desconto) > 0;
}

export function rotuloDesconto(tipo: TipoDesconto | '', desconto: string): string {
  if (tipo === 'PERCENTUAL') {
    return `Desconto (${formatarPercentual(desconto)})`;
  }
  if (tipo === 'FIXO') {
    return 'Desconto (fixo)';
  }
  return 'Desconto';
}