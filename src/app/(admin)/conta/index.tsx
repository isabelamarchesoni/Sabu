import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { TemaContext } from '../../../theme/TemaContext';
import { usuarioAtual, sair } from '../../../services/autenticacao';
import type { Usuario } from '../../../services/sessao';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import SectionTitle from '../../../components/ui/SectionTitle';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';
import ConfirmModal from '../../../components/ui/ConfirmModal';

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0] ? partes[0][0] : '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return `${primeira}${ultima}`.toUpperCase();
}

export default function Conta() {
  const { cores } = useContext(TemaContext);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const [saindo, setSaindo] = useState(false);

  useEffect(function () {
    carregar();
  }, []);

  async function carregar() {
    setUsuario(await usuarioAtual());
  }

  async function confirmarSaida() {
    setSaindo(true);
    await sair();
    setConfirmandoSaida(false);
    router.replace('/login');
  }

  return (
    <Screen rolavel>
      <Header titulo="Minha conta" voltar acoes={<ThemeToggle />} />

      <View style={[estilos.perfil, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
        <View style={[estilos.avatar, { backgroundColor: cores.botao }]}>
          <Text style={[estilos.iniciais, { color: cores.botaoTexto }]}>{usuario ? iniciais(usuario.nome) : ''}</Text>
        </View>
        <View style={estilos.textos}>
          <Text style={[estilos.nome, { color: cores.texto }]}>{usuario ? usuario.nome : ''}</Text>
          <Text style={[estilos.cargo, { color: cores.textoApoio }]}>{usuario && usuario.cargo === 'ADMIN' ? 'Administrador' : usuario ? usuario.cargo : ''}</Text>
        </View>
      </View>

      <View style={estilos.secao}>
        <SectionTitle titulo="Equipe" />
        <ListItem
          titulo="Cadastrar administrador"
          subtitulo="Dar acesso ao painel para outra pessoa"
          aoPressionar={function () {
            router.push('/administradores/novo');
          }}
        />
      </View>

      <View style={estilos.secao}>
        <SectionTitle titulo="Loja" />
        <ListItem
          titulo="Ver vitrine"
          subtitulo="Como os compradores veem a loja"
          aoPressionar={function () {
            router.push('/vitrine');
          }}
        />
      </View>

      <View style={estilos.rodape}>
        <Button
          titulo="Sair"
          variante="secundario"
          icone="log-out-outline"
          aoPressionar={function () {
            setConfirmandoSaida(true);
          }}
        />
      </View>

      <ConfirmModal
        visivel={confirmandoSaida}
        titulo="Sair da conta?"
        mensagem="Você vai precisar entrar de novo para acessar o painel."
        textoConfirmar="Sair"
        perigo
        carregando={saindo}
        aoConfirmar={confirmarSaida}
        aoCancelar={function () {
          setConfirmandoSaida(false);
        }}
      />
    </Screen>
  );
}

const estilos = StyleSheet.create({
  perfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciais: {
    fontSize: 20,
    fontWeight: '700',
  },
  textos: {
    flex: 1,
    gap: 4,
  },
  nome: {
    fontSize: 18,
    fontWeight: '700',
  },
  cargo: {
    fontSize: 14,
  },
  secao: {
    marginTop: 24,
    gap: 10,
  },
  rodape: {
    marginTop: 32,
    marginBottom: 12,
  },
});
