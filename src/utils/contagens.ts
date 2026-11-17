export async function contarTodos(consultas: Promise<{ count: number }>[]): Promise<(number | null)[]> {
  const resultados = await Promise.allSettled(consultas);
  return resultados.map(function (resultado) {
    return resultado.status === 'fulfilled' ? resultado.value.count : null;
  });
}

export function plural(quantidade: number, singular: string, varios: string) {
  return `${quantidade} ${quantidade === 1 ? singular : varios}`;
}
