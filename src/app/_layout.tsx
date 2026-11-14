import { useContext } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
  return (
    <TemaProvider>
      <Navegacao />
    </TemaProvider>
  );
}