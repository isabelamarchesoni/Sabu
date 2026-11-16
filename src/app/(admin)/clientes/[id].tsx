// detalhe do cliente (/clientes/3). o id é o número do cliente. mostra os dados e os pedidos dele; editar abre clientes/formulario/[id].
import { useCallback, useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { TemaContext } from '../../../theme/TemaContext';
import { buscarCliente, apagarCliente, listarPedidos, SITUACOES_PEDIDO, type Cliente, type Pedido } from '../../../services/vendas';
import { ErroApi, mensagemDeErro } from '../../../services/api';
import { mascararCpfCnpj, mascararTelefone } from '../../../utils/mascaras';
import { formatarDinheiro } from '../../../utils/formatar';
import { formatarData } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import SectionTitle from '../../../components/ui/SectionTitle';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';
import Notice from '../../../components/ui/Notice';
import ScreenState from '../../../components/ui/ScreenState';
import ConfirmModal from '../../../components/ui/ConfirmModal';

export default function DetalheCliente() {
  const { cores } = useContext(TemaContext);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroAcao, setErroAcao] = useState('');
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [apagando, setApagando] = useState(false);

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
      const [dados, resposta] = await Promise.all([buscarCliente(Number(id)), listarPedidos({ clienteId: Number(id), ordenacao: '-criado_em' })]);
      setCliente(dados);
      setPedidos(resposta.results);
      setTotalPedidos(resposta.count);
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível carregar o cliente.'));
    } finally {
      setCarregando(false);
    }
  }

  function tentarNovamente() {
    setCarregando(true);
    carregar();
  }

  async function apagar() {
    setApagando(true);
    try {
      await apagarCliente(Number(id));
      setConfirmandoExclusao(false);
      router.back();
    } catch (e) {
      setConfirmandoExclusao(false);
      if (e instanceof ErroApi && e.codigo === 'registro_protegido') {
        setErroAcao('A API recusou a exclusão porque este cliente ainda tem vínculos.');
      } else {
        setErroAcao(mensagemDeErro(e, 'Não foi possível excluir o cliente.'));
      }
    } finally {
      setApagando(false);
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

  if (carregando || !cliente) {
    return (
      <Screen>
        <Header titulo="Cliente" voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando cliente…' : erro}
          aoTentarNovamente={carregando ? undefined : tentarNovamente}
        />
      </Screen>
    );
  }

  return (
    <Screen rolavel>
      <Header titulo="Cliente" voltar />

      {erroAcao ? <Notice mensagem={erroAcao} tom="erro" /> : null}

      <Text style={[estilos.nome, { color: cores.texto }]}>{cliente.nome}</Text>

      <View style={[estilos.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
        {linha('Telefone', cliente.telefone ? mascararTelefone(cliente.telefone) : 'Não informado')}
        {linha('CPF/CNPJ', cliente.cpf_cnpj ? mascararCpfCnpj(cliente.cpf_cnpj) : 'Não informado')}
        {linha('Último pedido', cliente.ultimo_pedido_em ? formatarData(cliente.ultimo_pedido_em) : 'Nenhum')}
        {linha('Cadastrado em', formatarData(cliente.criado_em))}
      </View>

      <View style={estilos.secao}>
        <SectionTitle
          titulo={totalPedidos > 0 ? `Pedidos (${totalPedidos})` : 'Pedidos'}
          textoAcao="Novo pedido"
          aoPressionarAcao={function () {
            router.push(`/pedidos/formulario/novo?cliente=${cliente.id}` as Href);
          }}
        />
        {pedidos.length > 0 ? (
          pedidos.map(function (pedido) {
            return (
              <ListItem
                key={pedido.id}
                titulo={`Pedido #${pedido.id}`}
                subtitulo={`${formatarData(pedido.criado_em)} · ${pedido.itens.length} ${pedido.itens.length === 1 ? 'item' : 'itens'}`}
                detalhe={formatarDinheiro(pedido.valor_total)}
                selo={SITUACOES_PEDIDO[pedido.status]}
                aoPressionar={function () {
                  router.push(`/pedidos/${pedido.id}` as Href);
                }}
              />
            );
          })
        ) : (
          <Text style={[estilos.vazio, { color: cores.textoApoio }]}>Este cliente ainda não fez pedidos.</Text>
        )}
      </View>

      <View style={estilos.acoes}>
        <Button
          titulo="Editar cliente"
          variante="secundario"
          icone="create-outline"
          aoPressionar={function () {
            router.push(`/clientes/formulario/${cliente.id}`);
          }}
        />
      </View>

      <View style={estilos.perigo}>
        <Button
          titulo="Excluir cliente"
          variante="textoPerigo"
          icone="trash-outline"
          aoPressionar={function () {
            setErroAcao('');
            setConfirmandoExclusao(true);
          }}
        />
      </View>

      <ConfirmModal
        visivel={confirmandoExclusao}
        titulo="Excluir cliente?"
        mensagem={`"${cliente.nome}" será apagado de vez. Os pedidos dele continuam existindo, mas ficam sem cliente.`}
        textoConfirmar="Excluir"
        perigo
        carregando={apagando}
        aoConfirmar={apagar}
        aoCancelar={function () {
          setConfirmandoExclusao(false);
        }}
      />
    </Screen>
  );
}

const estilos = StyleSheet.create({
  nome: {
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
  secao: {
    marginTop: 24,
    gap: 10,
  },
  vazio: {
    fontSize: 14,
  },
  acoes: {
    marginTop: 28,
  },
  perigo: {
    marginTop: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
});