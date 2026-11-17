import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ImageSourcePropType } from 'react-native';

const CHAVE_AVATAR = 'sabu:avatar';

export type Avatar = {
  chave: string;
  nome: string;
  imagem: ImageSourcePropType;
};

export const AVATARES: Avatar[] = [
  { chave: 'oi', nome: 'Oi!', imagem: require('../../assets/sapos/sapo-oi.jpg') },
  { chave: 'tudo-bem', nome: 'Tá tudo bem', imagem: require('../../assets/sapos/sapo-tudo-bem.jpg') },
  { chave: 'espiando', nome: 'Espiando', imagem: require('../../assets/sapos/sapo-espiando.jpg') },
  { chave: 'coracao', nome: 'Seja você', imagem: require('../../assets/sapos/sapo-coracao.jpg') },
  { chave: 'banho', nome: 'Hora do banho', imagem: require('../../assets/sapos/sapo-banho.jpg') },
  { chave: 'bora', nome: 'Bora cuidar', imagem: require('../../assets/sapos/sapo-bora.jpg') },
  { chave: 'cha', nome: 'Um dia de cada vez', imagem: require('../../assets/sapos/sapo-cha.jpg') },
  { chave: 'cuidados', nome: 'Pequenos cuidados', imagem: require('../../assets/sapos/sapo-cuidados.jpg') },
  { chave: 'amigos', nome: 'Bons amigos', imagem: require('../../assets/sapos/sapo-amigos.jpg') },
  { chave: 'vida-boa', nome: 'Vida boa', imagem: require('../../assets/sapos/sapo-vida-boa.jpg') },
  { chave: 'aventura', nome: 'Novas aventuras', imagem: require('../../assets/sapos/sapo-aventura.jpg') },
  { chave: 'abraco', nome: 'Abraço', imagem: require('../../assets/sapos/sapo-abraco.jpg') },
];

export function avatarPorChave(chave: string | null) {
  return AVATARES.find(function (avatar) {
    return avatar.chave === chave;
  });
}

export async function lerAvatar() {
  return AsyncStorage.getItem(CHAVE_AVATAR);
}

export async function salvarAvatar(chave: string) {
  await AsyncStorage.setItem(CHAVE_AVATAR, chave);
}
