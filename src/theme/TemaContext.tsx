import { createContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { temaClaro, temaEscuro, Tema } from './cores';

type ValorTema = {
  cores: Tema;
  modoEscuro: boolean;
  alternarTema: () => void;
};

export const TemaContext = createContext<ValorTema>({
  cores: temaClaro,
  modoEscuro: false,
  alternarTema: function () {},
});

const CHAVE_TEMA = 'sabu:tema';

type Props = {
  children: ReactNode;
};

export function TemaProvider({ children }: Props) {
  const temaDoCelular = useColorScheme();
  const [modoEscuro, setModoEscuro] = useState(temaDoCelular === 'dark');

  useEffect(function () {
    carregarTemaSalvo();
  }, []);

  async function carregarTemaSalvo() {
    const salvo = await AsyncStorage.getItem(CHAVE_TEMA);
    if (salvo === 'escuro') setModoEscuro(true);
    if (salvo === 'claro') setModoEscuro(false);
  }

  async function alternarTema() {
    const novoModo = !modoEscuro;
    setModoEscuro(novoModo);
    await AsyncStorage.setItem(CHAVE_TEMA, novoModo ? 'escuro' : 'claro');
  }

  return (
    <TemaContext.Provider
      value={{
        cores: modoEscuro ? temaEscuro : temaClaro,
        modoEscuro: modoEscuro,
        alternarTema: alternarTema,
      }}
    >
      {children}
    </TemaContext.Provider>
  );
}