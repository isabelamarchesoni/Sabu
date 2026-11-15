import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { usuarioAtual } from '../../services/autenticacao';
import ScreenState from '../../components/ui/ScreenState';

export default function LayoutAdmin() {
  const [verificando, setVerificando] = useState(true);

  useEffect(function () {
    verificar();
  }, []);

  async function verificar() {
    const usuario = await usuarioAtual();
    if (!usuario) {
      router.replace('/login');
      return;
    }
    setVerificando(false);
  }

  if (verificando) {
    return <ScreenState tipo="carregando" mensagem="Verificando acesso…" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}