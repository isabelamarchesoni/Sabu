import { ErroApi } from '../services/api';

export function erroDoCampo(erro: unknown, campo: string) {
  if (!(erro instanceof ErroApi) || !erro.erros || typeof erro.erros !== 'object') {
    return undefined;
  }
  const mensagens = (erro.erros as Record<string, unknown>)[campo];
  if (Array.isArray(mensagens) && mensagens.length > 0) {
    return String(mensagens[0]);
  }
  if (typeof mensagens === 'string') {
    return mensagens;
  }
  return undefined;
}