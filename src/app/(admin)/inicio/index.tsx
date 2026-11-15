import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { usuarioAtual, sair } from '../../../services/autenticacao';
import { type Usuario } from '../../../services/sessao';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Notice from '../../../components/ui/Notice';
import Button from '../../../components/ui/Button';
import ThemeToggle from '../../../components/ui/ThemeToggle';

export default function Inicio() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [saindo, setSaindo] = useState(false);

  useEffect(function () {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    setUsuario(await usuarioAtual());
  }

  async function sairDaConta() {
    setSaindo(true);
    await sair();
    router.replace('/login');
  }

  const primeiroNome = usuario ? usuario.nome.split(' ')[0] : '';

  return (
    <Screen rolavel>
      <Header titulo={`Olá, ${primeiroNome}`} subtitulo="Que bom te ver por aqui." grande acoes={<ThemeToggle />} />
      <Notice tom="sucesso" mensagem="Login feito com sucesso." />
      <Button titulo="Sair" variante="secundario" icone="log-out-outline" carregando={saindo} aoPressionar={sairDaConta} />
    </Screen>
  );
}