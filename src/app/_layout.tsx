// layout raiz é obrigatório e vale para o app inteiro: carrega a fonte manuscrita (Gaegu) e liga o tema (TemaProvider);
// a barra de status e a pilha principal (Stack) com splash, login, vitrine e a área (admin).
import { useContext } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Gaegu_400Regular, Gaegu_700Bold } from '@expo-google-fonts/gaegu';
import { TemaProvider, TemaContext } from '../theme/TemaContext';

function Navegacao() {
  const { cores, modoEscuro } = useContext(TemaContext);

  return (
    <>
      <StatusBar style={modoEscuro ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: cores.fundo },
        }}
      />
    </>
  );
}

export default function Layout() {
  const [fontesProntas, erroFontes] = useFonts({ Gaegu_400Regular, Gaegu_700Bold });

  if (!fontesProntas && !erroFontes) {
    return null;
  }

  return (
    <TemaProvider>
      <Navegacao />
    </TemaProvider>
  );
}