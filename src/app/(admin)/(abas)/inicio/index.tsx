import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import ThemeToggle from '../../../../components/ui/ThemeToggle';
import SectionTitle from '../../../../components/ui/SectionTitle';
import StatCard from '../../../../components/ui/StatCard';
import ListItem from '../../../../components/ui/ListItem';
import Notice from '../../../../components/ui/Notice';
import Button from '../../../../components/ui/Button';
import ConfirmModal from '../../../../components/ui/ConfirmModal';
import { usuarioAtual, sair } from '../../../../services/autenticacao';
import { carregarResumo, type ResumoPainel } from '../../../../services/painel';
import { ErroApi, mensagemDeErro } from '../../../../services/api';
import type { Usuario } from '../../../../services/sessao';

function saudacaoDoHorario() {
  const hora = new Date().getHours();
  if (hora < 12) { return 'Bom dia'; }
  if (hora < 18) { return 'Boa tarde'; }
  return 'Boa noite';
}

function abrir(rota: string) {
  router.push(rota as Href);
}

export default function Inicio() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [resumo, setResumo] = useState<ResumoPainel | null>(null);
  const [erro, setErro] = useState('');
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const [saindo, setSaindo] = useState(false);

  useEffect(function () { carregarUsuario(); }, []);

  useFocusEffect(useCallback(function () { carregarPainel(); }, []));

  async function carregarUsuario() {
    setUsuario(await usuarioAtual());
  }

  async function carregarPainel() {
    setErro('');
    try {
      setResumo(await carregarResumo());
    } catch (e) {
      if (e instanceof ErroApi && e.codigo === 'sessao_expirada') { router.replace('/login'); return; }
      setErro(mensagemDeErro(e, 'Não foi possível carregar o resumo do painel.'));
    }
  }

  async function confirmarSaida() {
    setSaindo(true);
    await sair();
    setConfirmandoSaida(false);
    router.replace('/login');
  }

  const primeiroNome = usuario ? usuario.nome.split(' ')[0] : '';

  return (
    <Screen rolavel>
      <Header titulo={primeiroNome ? `Olá, ${primeiroNome}` : 'Olá'} subtitulo={`${saudacaoDoHorario()}! Veja como está a loja hoje.`} grande acoes={<ThemeToggle />} />
      <View style={estilos.secao}>
        <SectionTitle titulo="Precisa de atenção" />
        {erro ? <Notice mensagem={erro} tom="erro" /> : null}
        {erro ? <Button titulo="Tentar novamente" variante="texto" aoPressionar={carregarPainel} /> : null}
        <View style={estilos.linha}>
          <StatCard rotulo="Pedidos pendentes" valor={resumo ? resumo.pedidosPendentes : null} icone="receipt-outline" tom="alerta" aoPressionar={function () {abrir('/pedidos?status=PENDENTE'); }} />
          <StatCard rotulo="Matéria-prima vencida" valor={resumo ? resumo.lotesMateriaVencidos : null} icone="flask-outline" tom="erro" aoPressionar={function () { abrir('/lotes-materia-prima'); }} />
          <StatCard rotulo="Sabonetes vencidos" valor={resumo ? resumo.lotesSabonetesVencidos : null} icone="layers-outline" tom="erro" aoPressionar={function () { abrir('/lotes-sabonetes'); }} />
        </View>
      </View>
      <View style={estilos.secao}>
        <SectionTitle titulo="Acesso rápido" />
        <View style={estilos.lista}>
          <ListItem titulo="Novo pedido" subtitulo="Registrar uma venda" aoPressionar={function () { abrir('/pedidos/formulario/novo'); }} />
          <ListItem titulo="Nova compra" subtitulo="Registrar a entrada de matéria-prima" aoPressionar={function () { abrir('/historico-compras/novo'); }} />
          <ListItem titulo="Ver vitrine" subtitulo="Como os compradores veem a loja" aoPressionar={function () { abrir('/vitrine'); }} />
        </View>
      </View>
      <View style={estilos.rodape}>
        <Button titulo="Sair" variante="secundario" icone="log-out-outline" aoPressionar={function () { setConfirmandoSaida(true); }} />
      </View>
      <ConfirmModal visivel={confirmandoSaida} titulo="Sair da conta?" mensagem="Você vai precisar entrar de novo para acessar o painel." textoConfirmar="Sair" perigo carregando={saindo} aoConfirmar={confirmarSaida} aoCancelar={function () { setConfirmandoSaida(false); }} />
    </Screen>
  );
}

const estilos = StyleSheet.create({
  secao: {
    marginTop: 24,
    gap: 12,
  },
  linha: {
    flexDirection: 'row',
    gap: 10,
  },
  lista: {
    gap: 10,
  },
  rodape: {
    marginTop: 32,
    marginBottom: 12,
  },
});