export function formatarData(valor: string | null | undefined) {
  if (!valor) {
    return '';
  }
  const data = valor.length === 10 ? new Date(`${valor}T00:00:00`) : new Date(valor);
  return data.toLocaleDateString('pt-BR');
}

export function lerData(texto: string) {
  const partes = texto.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!partes) {
    return null;
  }
  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  const ano = Number(partes[3]);
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return null;
  }
  return data;
}