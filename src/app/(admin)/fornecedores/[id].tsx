// Detalhe do fornecedor (/fornecedores/3). O id é o número do fornecedor. Mostra contatos e compras; editar abre fornecedores/formulario/[id].
import { useCallback, useContext, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { TemaContext } from '../../../theme/TemaContext';
import { buscarFornecedor, apagarFornecedor, restaurarFornecedor, marcarFavorito, listarCompras, SITUACOES_COMPRA, type Compra, type Fornecedor } from '../../../services/compras';
import { rotuloTipo, formatarCusto } from '../../../services/estoque';
import { mensagemDeErro } from '../../../services/api';
import { formatarData } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Badge from '../../../components/ui/Badge';
import SectionTitle from '../../../components/ui/SectionTitle';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';
import Notice from '../../../components/ui/Notice';
import ScreenState from '../../../components/ui/ScreenState';
import ConfirmModal from '../../../components/ui/ConfirmModal';

export default function DetalheFornecedor() {
  const { cores } = useContext(TemaContext);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [totalCompras, setTotalCompras] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroAcao, setErroAcao] = useState('');
  const [aviso, setAviso] = useState('');
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [processando, setProcessando] = useState(false);

  useFocusEffect(
    useCallback(
      function () {
        carregar();
      },
      [id]
    )
  );

  async function carregar() {
    setErro('');
    try {
      const [dados, listaCompras] = await Promise.all([buscarFornecedor(Number(id)), listarCompras({ pagina: 1, fornecedorId: Number(id) })]);
      setFornecedor(dados);
      setCompras(listaCompras.results.slice(0, 5));
      setTotalCompras(listaCompras.count);
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível carregar o fornecedor.'));
    } finally {
      setCarregando(false);
    }
  }

  function tentarNovamente() {
    setCarregando(true);
    carregar();
  }

  async function apagar() {
    setProcessando(true);
    setErroAcao('');
    try {
      await apagarFornecedor(Number(id));
      setConfirmandoExclusao(false);
      setAviso('Fornecedor apagado. Os vínculos dele com matérias-primas também foram apagados.');
      await carregar();
    } catch (e) {
      setConfirmandoExclusao(false);
      setErroAcao(mensagemDeErro(e, 'Não foi possível apagar o fornecedor.'));
    } finally {
      setProcessando(false);
    }
  }

  async function restaurar() {
    setProcessando(true);
    setErroAcao('');
    try {
      await restaurarFornecedor(Number(id));
      setAviso('Fornecedor restaurado. Os vínculos não voltam sozinhos.');
      await carregar();
    } catch (e) {
      setErroAcao(mensagemDeErro(e, 'Não foi possível restaurar o fornecedor.'));
    } finally {
      setProcessando(false);
    }
  }

  async function alternarFavorito() {
    if (!fornecedor) {
      return;
    }
    const desejado = !fornecedor.favorito;
    setProcessando(true);
    setErroAcao('');
    setAviso('');
    try {
      const atualizado = await marcarFavorito(fornecedor.id, desejado);
      setFornecedor(atualizado);
      if (atualizado.favorito !== desejado) {
        setErroAcao('O servidor respondeu, mas não gravou o favorito. Avise o back-end: o campo "favorito" está sendo ignorado.');
      } else {
        setAviso(desejado ? 'Fornecedor marcado como favorito.' : 'Fornecedor tirado dos favoritos.');
      }
    } catch (e) {
      setErroAcao(mensagemDeErro(e, 'Não foi possível mudar o favorito.'));
    } finally {
      setProcessando(false);
    }
  }

  async function abrirLink(endereco: string) {
    try {
      await Linking.openURL(endereco);
    } catch {
      setErroAcao('Não foi possível abrir o link.');
    }
  }

  function linha(rotulo: string, valor: string) {
    return (
      <View style={[estilos.linha, { borderColor: cores.borda }]}>
        <Text style={[estilos.rotulo, { color: cores.textoApoio }]}>{rotulo}</Text>
        <Text style={[estilos.valor, { color: cores.texto }]}>{valor}</Text>
      </View>
    );
  }

  if (carregando || !fornecedor) {
    return (
      <Screen>
        <Header titulo="Fornecedor" voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando fornecedor…' : erro}
          aoTentarNovamente={carregando ? undefined : tentarNovamente}
        />
      </Screen>
    );
  }

  const apagado = fornecedor.apagado_em !== null;
  const prazo = `${fornecedor.prazo_medio_entrega_em_dias} ${fornecedor.prazo_medio_entrega_em_dias === 1 ? 'dia' : 'dias'}`;

  return (
    <Screen rolavel>
      <Header
        titulo="Fornecedor"
        voltar
        acoes={
          apagado ? undefined : (
            <Pressable
              onPress={alternarFavorito}
              disabled={processando}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={fornecedor.favorito ? 'Tirar dos favoritos' : 'Marcar como favorito'}
            >
              <Ionicons name={fornecedor.favorito ? 'star' : 'star-outline'} size={26} color={fornecedor.favorito ? cores.botao : cores.textoApoio} />
            </Pressable>
          )
        }
      />

      {apagado ? <Notice mensagem="Este fornecedor está apagado. Restaure para voltar a comprar dele." tom="erro" /> : null}
      {aviso ? <Notice mensagem={aviso} tom="sucesso" /> : null}
      {erroAcao ? <Notice mensagem={erroAcao} tom="erro" /> : null}

      <View style={estilos.topo}>
        <Text style={[estilos.nome, { color: cores.texto }]}>{fornecedor.nome}</Text>
        {apagado ? <Badge texto="Apagado" tom="erro" /> : fornecedor.favorito ? <Badge texto="Favorito" tom="destaque" /> : null}
      </View>

      <View style={[estilos.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
        {linha('Categorias', fornecedor.categorias.map(rotuloTipo).join(', '))}
        {linha('Prazo médio de entrega', prazo)}
        {linha('Plataforma', fornecedor.plataforma || 'Não informada')}
        {linha('Telefone', fornecedor.telefone || 'Não informado')}
        {linha('E-mail', fornecedor.email || 'Não informado')}
        {linha('Forma de pagamento', fornecedor.forma_pagamento || 'Não informada')}
      </View>

      {fornecedor.link ? (
        <View style={estilos.link}>
          <Button
            titulo="Abrir site do fornecedor"
            variante="secundario"
            icone="open-outline"
            aoPressionar={function () {
              abrirLink(fornecedor.link);
            }}
          />
        </View>
      ) : null}

      <View style={estilos.secao}>
        <SectionTitle
          titulo={totalCompras > 5 ? `Últimas compras (${totalCompras})` : 'Compras'}
          textoAcao={apagado ? undefined : 'Nova compra'}
          aoPressionarAcao={
            apagado
              ? undefined
              : function () {
                  router.push(`/historico-compras/novo?fornecedor=${fornecedor.id}` as Href);
                }
          }
        />
        {compras.length > 0 ? (
          compras.map(function (compra) {
            return (
              <ListItem
                key={compra.id}
                titulo={`Compra #${compra.id}`}
                subtitulo={`${formatarData(compra.compra_realizada_em)} · ${compra.itens.length} ${compra.itens.length === 1 ? 'item' : 'itens'}`}
                detalhe={formatarCusto(compra.valor_total)}
                selo={SITUACOES_COMPRA[compra.status]}
                aoPressionar={function () {
                  router.push(`/historico-compras/${compra.id}` as Href);
                }}
              />
            );
          })
        ) : (
          <Text style={[estilos.vazio, { color: cores.textoApoio }]}>Nenhuma compra deste fornecedor ainda.</Text>
        )}
        {totalCompras > 5 ? (
          <Button
            titulo="Ver todas as compras"
            variante="secundario"
            aoPressionar={function () {
              router.push(`/historico-compras?fornecedor=${fornecedor.id}` as Href);
            }}
          />
        ) : null}
      </View>

      <View style={estilos.acoes}>
        {!apagado ? (
          <Button
            titulo="Vincular matéria-prima"
            variante="secundario"
            icone="link-outline"
            aoPressionar={function () {
              router.push(`/vinculos/novo?fornecedor=${fornecedor.id}` as Href);
            }}
          />
        ) : null}
        <Button
          titulo="Editar fornecedor"
          variante="secundario"
          icone="create-outline"
          aoPressionar={function () {
            router.push(`/fornecedores/formulario/${fornecedor.id}`);
          }}
        />
        {apagado ? <Button titulo="Restaurar fornecedor" variante="secundario" icone="refresh" carregando={processando} aoPressionar={restaurar} /> : null}
      </View>

      {!apagado ? (
        <View style={estilos.perigo}>
          <Button
            titulo="Excluir fornecedor"
            variante="textoPerigo"
            icone="trash-outline"
            aoPressionar={function () {
              setAviso('');
              setErroAcao('');
              setConfirmandoExclusao(true);
            }}
          />
        </View>
      ) : null}

      <ConfirmModal
        visivel={confirmandoExclusao}
        titulo="Excluir fornecedor?"
        mensagem={`"${fornecedor.nome}" sai das listas e os vínculos dele com matérias-primas também são apagados. As compras continuam no histórico, e dá para restaurar depois.`}
        textoConfirmar="Excluir"
        perigo
        carregando={processando}
        aoConfirmar={apagar}
        aoCancelar={function () {
          setConfirmandoExclusao(false);
        }}
      />
    </Screen>
  );
}

const estilos = StyleSheet.create({
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  nome: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  cartao: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rotulo: {
    fontSize: 14,
  },
  valor: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  link: {
    marginTop: 12,
  },
  secao: {
    marginTop: 24,
    gap: 10,
  },
  vazio: {
    fontSize: 14,
  },
  acoes: {
    marginTop: 28,
    gap: 10,
  },
  perigo: {
    marginTop: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
});
