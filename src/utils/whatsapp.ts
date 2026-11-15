import { NUMERO_WHATSAPP } from '../services/config';

function somenteDigitos(texto: string) {
  return texto.replace(/\D/g, '');
}

export function whatsappDisponivel() {
  return somenteDigitos(NUMERO_WHATSAPP).length >= 12;
}

export function linkWhatsapp(mensagem: string) {
  return `https://wa.me/${somenteDigitos(NUMERO_WHATSAPP)}?text=${encodeURIComponent(mensagem)}`;
}