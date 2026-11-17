import { useContext, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { TemaContext } from '../../../../theme/TemaContext';
import { usuarioAtual, sair } from '../../../../services/autenticacao';
import type { Usuario } from '../../../../services/sessao';
import { AVATARES, avatarPorChave, lerAvatar, salvarAvatar } from '../../../../utils/avatar';
import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import ThemeToggle from '../../../../components/ui/ThemeToggle';
import SectionTitle from '../../../../components/ui/SectionTitle';
import ListItem from '../../../../components/ui/ListItem';
import Button from '../../../../components/ui/Button';
import ConfirmModal from '../../../../components/ui/ConfirmModal';

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
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(function () {
    carregar();
  }, []);

  async function carregar() {
    setUsuario(await usuarioAtual());
    setAvatar(await lerAvatar());
  }

  async function escolherAvatar(chave: string) {
    setAvatar(chave);
    await salvarAvatar(chave);
  }

  async function confirmarSaida() {
    setSaindo(true);
    await sair();
    setConfirmandoSaida(false);
    router.replace('/login');
  }

  const escolhido = avatarPorChave(avatar);

  return (
    <Screen rolavel>
      <Header titulo="Minha conta" grande acoes={<ThemeToggle />} />

      <View style={[estilos.perfil, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
        {escolhido ? (
          <Image source={escolhido.imagem} style={[estilos.avatar, { borderColor: cores.borda }]} accessibilityLabel={`Sapinho ${escolhido.nome}`} />
        ) : (
          <View style={[estilos.avatar, { backgroundColor: cores.botao }]}>
            <Text style={[estilos.iniciais, { color: cores.botaoTexto }]}>{usuario ? iniciais(usuario.nome) : ''}</Text>
          </View>
        )}
        <View style={estilos.textos}>
          <Text style={[estilos.nome, { color: cores.texto }]}>{usuario ? usuario.nome : ''}</Text>
          <Text style={[estilos.cargo, { color: cores.textoApoio }]}>{usuario && usuario.cargo === 'ADMIN' ? 'Administrador' : usuario ? usuario.cargo : ''}</Text>
        </View>
      </View>

      <View style={estilos.secao}>
        <SectionTitle titulo="Escolha seu sapinho" />
        <Text style={[estilos.ajuda, { color: cores.textoApoio }]}>O Bú, mascote da Sabu, vira a sua foto de perfil.</Text>
        <View style={estilos.grade}>
          {AVATARES.map(function (opcao) {
            const selecionado = opcao.chave === avatar;
            return (
              <Pressable
                key={opcao.chave}
                onPress={function () {
                  escolherAvatar(opcao.chave);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: selecionado }}
                accessibilityLabel={`Sapinho ${opcao.nome}`}
                style={[estilos.opcao, { borderColor: selecionado ? cores.botao : 'transparent' }]}
              >
                <Image source={opcao.imagem} style={estilos.opcaoImagem} />
              </Pressable>
            );
          })}
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
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ajuda: {
    fontSize: 14,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  opcao: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    padding: 2,
  },
  opcaoImagem: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
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
