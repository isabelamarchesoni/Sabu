function somenteDigitos(texto: string) {
  return texto.replace(/\D/g, '');
}

export function digitos(texto: string) {
  return somenteDigitos(texto);
}

export function mascararTelefone(texto: string) {
  const numeros = somenteDigitos(texto).slice(0, 11);
  if (numeros.length === 0) {
    return '';
  }
  if (numeros.length <= 2) {
    return `(${numeros}`;
  }
  if (numeros.length <= 6) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }
  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

export function mascararCpfCnpj(texto: string) {
  const numeros = somenteDigitos(texto).slice(0, 14);
  if (numeros.length <= 11) {
    let resultado = numeros.slice(0, 3);
    if (numeros.length > 3) {
      resultado += `.${numeros.slice(3, 6)}`;
    }
    if (numeros.length > 6) {
      resultado += `.${numeros.slice(6, 9)}`;
    }
    if (numeros.length > 9) {
      resultado += `-${numeros.slice(9)}`;
    }
    return resultado;
  }
  const final = numeros.length > 12 ? `-${numeros.slice(12)}` : '';
  return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}${final}`;
}

export function mascararData(texto: string) {
  const numeros = somenteDigitos(texto).slice(0, 8);
  if (numeros.length <= 2) {
    return numeros;
  }
  if (numeros.length <= 4) {
    return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  }
  return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4)}`;
}

export function mascararDecimal(texto: string, casas: number) {
  const limpo = texto.replace(/[^\d,]/g, '');
  const partes = limpo.split(',');
  if (partes.length === 1) {
    return partes[0];
  }
  return `${partes[0]},${partes.slice(1).join('').slice(0, casas)}`;
}

export function mascararCep(texto: string) {
  const numeros = somenteDigitos(texto).slice(0, 8);
  if (numeros.length <= 5) {
    return numeros;
  }
  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
}