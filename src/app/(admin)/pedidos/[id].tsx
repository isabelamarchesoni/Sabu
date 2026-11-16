// detalhe do pedido (/pedidos/3) id é o número do pedido, mostra cliente, endereço e itens, e as ações que a situação permite.
import { useCallback, useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { TemaContext } from '../../../theme/TemaContext';
import type { Variacao } from '../../../services/catalogo';
import { buscarVariacao } from '../../../services/variacoes';
import { buscarCliente, buscarPedido, cancelarPedido, concluirPedido, estornarPedido, SITUACOES_PEDIDO, type Cliente, type Pedido } from '../../../services/vendas';
import { ErroApi, mensagemDeErro } from '../../../services/api';
import { formatarDinheiro, paraNumero } from '../../../utils/formatar';
import { formatarDataHora } from '../../../utils/datas';
import { mascararTelefone } from '../../../utils/mascaras';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Badge from '../../../components/ui/Badge';
import SectionTitle from '../../../components/ui/SectionTitle';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';
import Notice from '../../../components/ui/Notice';
import ScreenState from '../../../components/ui/ScreenState';
import ConfirmModal from '../../../components/ui/ConfirmModal';

type Acao = 'concluir' | 'cancelar' | 'estornarCom' | 'estornarSem';

const ACOES: Record<Acao, { titulo: string; mensagem: string; confirmar: string; perigo: boolean; sucesso: string }> = {
  concluir: {
    titulo: 'Concluir pedido?',
    mensagem: 'O pedido passa a concluído. O estoque não muda, porque já saiu quando o pedido foi registrado.',
    confirmar: 'Concluir',
    perigo: false,
    sucesso: 'Pedido concluído.',
  },
  cancelar: {
    titulo: 'Cancelar pedido?',
    mensagem: 'O pedido passa a cancelado e cada item volta ao lote de onde saiu. Isso não pode ser desfeito.',
    confirmar: 'Cancelar pedido',
    perigo: true,
    sucesso: 'Pedido cancelado. Os sabonetes voltaram ao estoque.',
  },
  estornarCom: {
    titulo: 'Estornar com devolução?',
    mensagem: 'O pedido passa a estornado e os sabonetes voltam ao estoque, nos mesmos lotes. Isso não pode ser desfeito.',
    confirmar: 'Estornar',
    perigo: true,
    sucesso: 'Pedido estornado. Os sabonetes voltaram ao estoque.',
  },
  estornarSem: {
    titulo: 'Estornar sem devolução?',
    mensagem: 'O pedido passa a estornado e o estoque não muda (por exemplo, produto danificado). Isso não pode ser desfeito.',
    confirmar: 'Estornar',
    perigo: true,
    sucesso: 'Pedido estornado. O estoque não foi alterado.',
  },
};

function linhasEndereco(pedido: Pedido) {
  const linhas: string[] = [];
  const rua = [pedido.logradouro, pedido.numero_residencia].filter(Boolean).join(', ');
  const ruaCompleta = [rua, pedido.complemento].filter(Boolean).join(' · ');
  if (ruaCompleta) {
    linhas.push(ruaCompleta);
  }
  const cidade = [pedido.cidade, pedido.sigla_estado].filter(Boolean).join('/');
  const bairroCidade = [pedido.bairro, cidade].filter(Boolean).join(' · ');
  if (bairroCidade) {
    linhas.push(bairroCidade);
  }
  if (pedido.cep) {
    linhas.push(`CEP ${pedido.cep}`);
  }
  return linhas;
}

export default function DetalhePedido() {
  const { cores } = useContext(TemaContext);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [variacoes, setVariacoes] = useState<Record<number, Variacao>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroAcao, setErroAcao] = useState('');
  const [aviso, setAviso] = useState('');
  const [acaoPendente, setAcaoPendente] = useState<Acao | null>(null);
  const [executando, setExecutando] = useState(false);

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
      const dados = await buscarPedido(Number(id));
      const idsVariacoes = Array.from(
        new Set(
          dados.itens.map(function (item) {
            return item.variacao;
          })
        )
      );
      const [dadosCliente, listaVariacoes] = await Promise.all([
        dados.cliente !== null ? buscarCliente(dados.cliente).catch(function () { return null; }) : Promise.resolve(null),
        Promise.all(
          idsVariacoes.map(function (idVariacao) {
            return buscarVariacao(idVariacao).catch(function () {
              return null;
            });
          })
        ),
      ]);
      const mapa: Record<number, Variacao> = {};
      listaVariacoes.forEach(function (variacao) {
        if (variacao) {
          mapa[variacao.id] = variacao;
        }
      });
      setPedido(dados);
      setCliente(dadosCliente);
      setVariacoes(mapa);
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível carregar o pedido.'));
    } finally {
      setCarregando(false);
    }
  }

  function tentarNovamente() {
    setCarregando(true);
    carregar();
  }

  function pedirConfirmacao(acao: Acao) {
    setErroAcao('');
    setAviso('');
    setAcaoPendente(acao);
  }

  async function executar() {
    if (!acaoPendente) {
      return;
    }
    const acao = acaoPendente;
    setExecutando(true);
    try {
      if (acao === 'concluir') {
        await concluirPedido(Number(id));
      } else if (acao === 'cancelar') {
        await cancelarPedido(Number(id));
      } else {
        await estornarPedido(Number(id), acao === 'estornarCom');
      }
      setAcaoPendente(null);
      setAviso(ACOES[acao].sucesso);
      await carregar();
    } catch (e) {
      setAcaoPendente(null);
      if (e instanceof ErroApi && e.codigo === 'transicao_status_invalida') {
        setErroAcao(mensagemDeErro(e, 'Esta ação não é permitida na situação atual do pedido.'));
      } else {
        setErroAcao(mensagemDeErro(e, 'Não foi possível concluir a ação.'));
      }
    } finally {
      setExecutando(false);
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

  if (carregando || !pedido) {
    return (
      <Screen>
        <Header titulo="Pedido" voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando pedido…' : erro}
          aoTentarNovamente={carregando ? undefined : tentarNovamente}
        />
      </Screen>
    );
  }

  const endereco = linhasEndereco(pedido);
  const situacao = SITUACOES_PEDIDO[pedido.status];
  const configuracao = acaoPendente ? ACOES[acaoPendente] : null;

  return (
    <Screen rolavel>
      <Header titulo={`Pedido #${pedido.id}`} voltar />

      {aviso ? <Notice mensagem={aviso} tom="sucesso" /> : null}
      {erroAcao ? <Notice mensagem={erroAcao} tom="erro" /> : null}

      <View style={estilos.topo}>
        <Text style={[estilos.total, { color: cores.texto }]}>{formatarDinheiro(pedido.valor_total)}</Text>
        <Badge texto={situacao.texto} tom={situacao.tom} />
      </View>

      <View style={[estilos.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
        {linha('Criado em', formatarDataHora(pedido.criado_em))}
        {linha('Atualizado em', formatarDataHora(pedido.atualizado_em))}
        {linha('Observação', pedido.observacao || 'Nenhuma')}
      </View>

      <View style={estilos.secao}>
        <SectionTitle titulo="Cliente" />
        {cliente ? (
          <ListItem
            titulo={cliente.nome}
            subtitulo={mascararTelefone(cliente.telefone)}
            aoPressionar={function () {
              router.push(`/clientes/${cliente.id}`);
            }}
          />
        ) : (
          <Text style={[estilos.vazio, { color: cores.textoApoio }]}>Pedido sem cliente.</Text>
        )}
      </View>

      <View style={estilos.secao}>
        <SectionTitle titulo="Endereço de entrega" />
        {endereco.length > 0 ? (
          endereco.map(function (texto) {
            return (
              <Text key={texto} style={[estilos.endereco, { color: cores.texto }]}>
                {texto}
              </Text>
            );
          })
        ) : (
          <Text style={[estilos.vazio, { color: cores.textoApoio }]}>Sem endereço de entrega.</Text>
        )}
      </View>

      <View style={estilos.secao}>
        <SectionTitle
          titulo={`Itens (${pedido.itens.length})`}
          textoAcao="Movimentações"
          aoPressionarAcao={function () {
            router.push(`/movimentacoes-sabonetes?pedido=${pedido.id}` as Href);
          }}
        />
        {pedido.itens.map(function (item) {
          const variacao = variacoes[item.variacao];
          const subtotal = paraNumero(item.valor_unitario) * item.quantidade_item;
          return (
            <ListItem
              key={item.id}
              titulo={variacao ? variacao.nome : `Variação ${item.variacao}`}
              subtitulo={`${variacao ? `${variacao.sku} · ` : ''}${item.quantidade_item} × ${formatarDinheiro(item.valor_unitario)}`}
              detalhe={formatarDinheiro(subtotal)}
              aoPressionar={function () {
                router.push(`/variacoes/${item.variacao}`);
              }}
            />
          );
        })}
      </View>

      <View style={estilos.acoes}>
        {pedido.status === 'PENDENTE' ? (
          <>
            <Button
              titulo="Concluir pedido"
              icone="checkmark-circle-outline"
              aoPressionar={function () {
                pedirConfirmacao('concluir');
              }}
            />
            <Button
              titulo="Editar endereço e observação"
              variante="secundario"
              icone="create-outline"
              aoPressionar={function () {
                router.push(`/pedidos/formulario/${pedido.id}` as Href);
              }}
            />
            <Button
              titulo="Cancelar pedido"
              variante="textoPerigo"
              icone="close-circle-outline"
              aoPressionar={function () {
                pedirConfirmacao('cancelar');
              }}
            />
          </>
        ) : null}
        {pedido.status === 'CONCLUIDO' ? (
          <>
            <Button
              titulo="Estornar com devolução"
              variante="secundario"
              icone="return-down-back-outline"
              aoPressionar={function () {
                pedirConfirmacao('estornarCom');
              }}
            />
            <Button
              titulo="Estornar sem devolução"
              variante="textoPerigo"
              icone="alert-circle-outline"
              aoPressionar={function () {
                pedirConfirmacao('estornarSem');
              }}
            />
          </>
        ) : null}
        {pedido.status !== 'PENDENTE' && pedido.status !== 'CONCLUIDO' ? (
          <Text style={[estilos.vazio, { color: cores.textoApoio }]}>Este pedido está encerrado. Não há mais ações.</Text>
        ) : null}
      </View>

      <ConfirmModal
        visivel={configuracao !== null}
        titulo={configuracao ? configuracao.titulo : ''}
        mensagem={configuracao ? configuracao.mensagem : ''}
        textoConfirmar={configuracao ? configuracao.confirmar : ''}
        perigo={configuracao ? configuracao.perigo : false}
        carregando={executando}
        aoConfirmar={executar}
        aoCancelar={function () {
          setAcaoPendente(null);
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
  total: {
    fontSize: 28,
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
  endereco: {
    fontSize: 15,
    lineHeight: 22,
  },
  vazio: {
    fontSize: 14,
  },
  acoes: {
    marginTop: 28,
    marginBottom: 12,
    gap: 10,
  },
});