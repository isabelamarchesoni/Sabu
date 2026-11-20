import { useCallback, useContext, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { TemaContext } from '../../../../theme/TemaContext';
import Screen from '../../../../components/ui/Screen';
import ThemeToggle from '../../../../components/ui/ThemeToggle';
import SectionTitle from '../../../../components/ui/SectionTitle';
import StatCard from '../../../../components/ui/StatCard';
import ShortcutBar from '../../../../components/ui/ShortcutBar';
import MenuGroup from '../../../../components/ui/MenuGroup';
import Notice from '../../../../components/ui/Notice';
import Button from '../../../../components/ui/Button';
import { usuarioAtual } from '../../../../services/autenticacao';
import { carregarResumo, type ResumoPainel } from '../../../../services/painel';
import { ErroApi, mensagemDeErro } from '../../../../services/api';
import { avatarPorChave, lerAvatar } from '../../../../utils/avatar';
import type { Usuario } from '../../../../services/sessao';
import { formatarDataHora } from '../../../../utils/datas';

function saudacaoDoHorario() {
  const hora = new Date().getHours();
  if (hora < 12) {
    return 'Bom dia';
  }
  if (hora < 18) {
    return 'Boa tarde';
  }
  return 'Boa noite';
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0] ? partes[0][0] : '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return `${primeira}${ultima}`.toUpperCase();
}

function abrir(rota: string) {
  router.push(rota as Href);
}

export default function Inicio() {
  const { cores } = useContext(TemaContext);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [resumo, setResumo] = useState<ResumoPainel | null>(null);
  const [erro, setErro] = useState('');

  useFocusEffect(
    useCallback(function () {
      carregarTudo();
    }, [])
  );

  async function carregarTudo() {
    const [dadosUsuario, chaveAvatar] = await Promise.all([usuarioAtual(), lerAvatar()]);
    setUsuario(dadosUsuario);
    setAvatar(chaveAvatar);
    carregarPainel();
  }

  async function carregarPainel() {
    setErro('');
    try {
      setResumo(await carregarResumo());
    } catch (e) {
      if (e instanceof ErroApi && e.codigo === 'sessao_expirada') {
        router.replace('/login');
        return;
      }
      setErro(mensagemDeErro(e, 'Não foi possível carregar o resumo do painel.'));
    }
  }

  const primeiroNome = usuario ? usuario.nome.split(' ')[0] : '';
  const escolhido = avatarPorChave(avatar);
  const pendentes = resumo ? resumo.pedidosPendentes : null;
  const textoAtualizacao = resumo ? formatarDataHora(resumo.atualizadoEm) : '';

  return (
    <Screen rolavel>
      <View style={estilos.topo}>
        {escolhido ? (
          <Image source={escolhido.imagem} style={[estilos.avatar, { borderColor: cores.borda }]} accessibilityLabel={`Sapinho ${escolhido.nome}`} />
        ) : (
          <View style={[estilos.avatar, { backgroundColor: cores.botao, borderColor: cores.borda }]}>
            <Text style={[estilos.iniciais, { color: cores.botaoTexto }]}>{usuario ? iniciais(usuario.nome) : ''}</Text>
          </View>
        )}
        <View style={estilos.textosTopo}>
          <Text style={[estilos.saudacao, { color: cores.textoApoio }]}>{saudacaoDoHorario()},</Text>
          <Text style={[estilos.nome, { color: cores.texto }]} numberOfLines={1}>
            {primeiroNome || 'Olá'}
          </Text>
        </View>
        <ThemeToggle />
      </View>

      <ShortcutBar
        atalhos={[
          { rotulo: 'Novo pedido', rota: '/pedidos/formulario/novo', icone: 'add' },
          { rotulo: 'Nova compra', rota: '/historico-compras/novo', icone: 'add' },
        ]}
      />

      <View style={estilos.secao}>
        <SectionTitle titulo="Precisa de atenção" />
        {textoAtualizacao ? <Text style={[estilos.atualizacao, { color: cores.textoApoio }]}>Última atualização: {textoAtualizacao}</Text> : null}
        {erro ? <Notice mensagem={erro} tom="erro" /> : null}
        {erro ? <Button titulo="Tentar novamente" variante="texto" aoPressionar={carregarPainel} /> : null}
        <View style={estilos.linha}>
          <StatCard
            rotulo="Pedidos pendentes"
            valor={pendentes}
            icone="receipt-outline"
            tom="alerta"
            aoPressionar={function () {
              abrir('/pedidos?status=PENDENTE');
            }}
          />
          <StatCard
            rotulo="Matéria-prima vencida"
            valor={resumo ? resumo.lotesMateriaVencidos : null}
            icone="flask-outline"
            tom="erro"
            aoPressionar={function () {
              abrir('/lotes-materia-prima');
            }}
          />
          <StatCard
            rotulo="Sabonetes vencidos"
            valor={resumo ? resumo.lotesSabonetesVencidos : null}
            icone="layers-outline"
            tom="erro"
            aoPressionar={function () {
              abrir('/lotes-sabonetes');
            }}
          />
        </View>
      </View>

      <MenuGroup
        titulo="Loja"
        itens={[
          { titulo: 'Ver vitrine', subtitulo: 'Como os compradores veem a loja', rota: '/vitrine', icone: 'storefront-outline' },
          { titulo: 'Quiz do Bú', subtitulo: 'Indicação de sabonete para os clientes', rota: '/quiz', icone: 'sparkles-outline' },
        ]}
      />
    </Screen>
  );
}

const estilos = StyleSheet.create({
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciais: {
    fontSize: 20,
    fontWeight: '700',
  },
  textosTopo: {
    flex: 1,
  },
  saudacao: {
    fontSize: 15,
  },
  nome: {
    fontSize: 28,
    fontWeight: '700',
  },
  secao: {
    marginTop: 24,
    gap: 12,
  },
  atualizacao: {
    fontSize: 13,
  },
  linha: {
    flexDirection: 'row',
    gap: 10,
  },
});