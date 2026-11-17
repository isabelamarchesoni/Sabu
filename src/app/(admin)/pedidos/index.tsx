import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { listarClientes, listarPedidos, SITUACOES_PEDIDO, STATUS_PEDIDO, type Cliente, type StatusPedido } from '../../../services/vendas';
import { formatarDinheiro } from '../../../utils/formatar';
import { formatarData, lerData, paraDataApi } from '../../../utils/datas';
import { mascararData, mascararDecimal } from '../../../utils/mascaras';
import { pedidoTemDesconto } from '../../../utils/desconto';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Select from '../../../components/ui/Select';
import TextField from '../../../components/ui/TextField';
import Chip from '../../../components/ui/Chip';
import Button from '../../../components/ui/Button';
import PaginatedList from '../../../components/ui/PaginatedList';
import ListItem from '../../../components/ui/ListItem';

type Ordem = '-criado_em' | '-valor_total';

type FiltrosDigitados = {
  criadoDe: string;
  criadoAte: string;
  valorMin: string;
  valorMax: string;
};

const FILTROS_VAZIOS: FiltrosDigitados = {
  criadoDe: '',
  criadoAte: '',
  valorMin: '',
  valorMax: '',
};

function dataParaApi(texto: string) {
  const data = lerData(texto);
  return data ? paraDataApi(data) : undefined;
}

function valorParaApi(texto: string) {
  const limpo = texto.trim();
  return limpo ? limpo.replace(',', '.') : undefined;
}

export default function ListaPedidos() {
  const parametros = useLocalSearchParams<{ status?: string }>();
  const statusInicial = STATUS_PEDIDO.includes(parametros.status as StatusPedido) ? (parametros.status as StatusPedido) : null;

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(statusInicial !== null);
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [status, setStatus] = useState<StatusPedido | null>(statusInicial);
  const [digitados, setDigitados] = useState<FiltrosDigitados>(FILTROS_VAZIOS);
  const [aplicados, setAplicados] = useState<FiltrosDigitados>(FILTROS_VAZIOS);
  const [ordem, setOrdem] = useState<Ordem>('-criado_em');

  useEffect(function () {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    try {
      const resposta = await listarClientes({ pagina: 1, ordenacao: 'nome' });
      setClientes(resposta.results);
    } catch {
      setClientes([]);
    }
  }

  const nomesClientes: Record<number, string> = {};
  clientes.forEach(function (cliente) {
    nomesClientes[cliente.id] = cliente.nome;
  });

  const quantidadeFiltros =
    (clienteId !== null ? 1 : 0) +
    (status !== null ? 1 : 0) +
    Object.values(aplicados).filter(function (valor) {
      return valor !== '';
    }).length;

  function limparFiltros() {
    setClienteId(null);
    setStatus(null);
    setDigitados(FILTROS_VAZIOS);
    setAplicados(FILTROS_VAZIOS);
  }

  const painelFiltros = (
    <View style={estilos.cabecalho}>
      {mostrarFiltros ? (
        <View style={estilos.filtros}>
          <Select
            rotulo="Situação"
            opcoes={STATUS_PEDIDO.map(function (item) {
              return { valor: item, rotulo: SITUACOES_PEDIDO[item].texto };
            })}
            selecionados={status === null ? [] : [status]}
            aoMudar={function (valores) {
              setStatus(valores.length > 0 ? (valores[0] as StatusPedido) : null);
            }}
            placeholder="Todas as situações"
          />
          <Select
            rotulo="Cliente"
            opcoes={clientes.map(function (cliente) {
              return { valor: cliente.id, rotulo: cliente.nome };
            })}
            selecionados={clienteId === null ? [] : [clienteId]}
            aoMudar={function (valores) {
              setClienteId(valores.length > 0 ? Number(valores[0]) : null);
            }}
            placeholder="Todos os clientes"
          />
          <View style={estilos.linha}>
            <View style={estilos.metade}>
              <TextField
                rotulo="Criado de"
                valor={digitados.criadoDe}
                aoMudar={function (texto) {
                  setDigitados({ ...digitados, criadoDe: mascararData(texto) });
                }}
                placeholder="dd/mm/aaaa"
                teclado="number-pad"
              />
            </View>
            <View style={estilos.metade}>
              <TextField
                rotulo="Até"
                valor={digitados.criadoAte}
                aoMudar={function (texto) {
                  setDigitados({ ...digitados, criadoAte: mascararData(texto) });
                }}
                placeholder="dd/mm/aaaa"
                teclado="number-pad"
              />
            </View>
          </View>
          <View style={estilos.linha}>
            <View style={estilos.metade}>
              <TextField
                rotulo="Valor mínimo"
                valor={digitados.valorMin}
                aoMudar={function (texto) {
                  setDigitados({ ...digitados, valorMin: mascararDecimal(texto, 2) });
                }}
                placeholder="0,00"
                teclado="decimal-pad"
              />
            </View>
            <View style={estilos.metade}>
              <TextField
                rotulo="Valor máximo"
                valor={digitados.valorMax}
                aoMudar={function (texto) {
                  setDigitados({ ...digitados, valorMax: mascararDecimal(texto, 2) });
                }}
                placeholder="0,00"
                teclado="decimal-pad"
              />
            </View>
          </View>
          <View style={estilos.linha}>
            <View style={estilos.metade}>
              <Button titulo="Limpar" variante="secundario" aoPressionar={limparFiltros} />
            </View>
            <View style={estilos.metade}>
              <Button
                titulo="Aplicar"
                aoPressionar={function () {
                  setAplicados(digitados);
                }}
              />
            </View>
          </View>
        </View>
      ) : null}
      <View style={estilos.chips}>
        <Chip
          rotulo="Recentes"
          selecionado={ordem === '-criado_em'}
          aoPressionar={function () {
            setOrdem('-criado_em');
          }}
        />
        <Chip
          rotulo="Maior valor"
          selecionado={ordem === '-valor_total'}
          aoPressionar={function () {
            setOrdem('-valor_total');
          }}
        />
      </View>
    </View>
  );

  return (
    <Screen
      rodape={
        <Button
          titulo="Novo pedido"
          icone="add"
          aoPressionar={function () {
            router.push('/pedidos/formulario/novo' as Href);
          }}
        />
      }
    >
      <Header
        titulo="Pedidos"
        subtitulo="Vendas e o andamento de cada uma"
        voltar
        acoes={
          <Button
            titulo={quantidadeFiltros > 0 ? `Filtros (${quantidadeFiltros})` : 'Filtros'}
            variante="texto"
            icone="options-outline"
            aoPressionar={function () {
              setMostrarFiltros(!mostrarFiltros);
            }}
          />
        }
      />

      <View style={estilos.lista}>
        <PaginatedList
          carregar={function (pagina) {
            return listarPedidos({
              pagina: pagina,
              clienteId: clienteId,
              status: status,
              criadoDe: dataParaApi(aplicados.criadoDe),
              criadoAte: dataParaApi(aplicados.criadoAte),
              valorMin: valorParaApi(aplicados.valorMin),
              valorMax: valorParaApi(aplicados.valorMax),
              ordenacao: ordem,
            });
          }}
          dependencias={[clienteId, status, aplicados, ordem]}
          chave={function (pedido) {
            return String(pedido.id);
          }}
          renderizarItem={function (pedido) {
            const nomeCliente = pedido.cliente === null ? 'Sem cliente' : nomesClientes[pedido.cliente] ?? `Cliente ${pedido.cliente}`;
            const quantidadeItens = `${pedido.itens.length} ${pedido.itens.length === 1 ? 'item' : 'itens'}`;
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={`Pedido #${pedido.id} · ${nomeCliente}`}
                  subtitulo={`${formatarData(pedido.criado_em)} · ${quantidadeItens}`}
                  detalhe={formatarDinheiro(pedido.valor_total)}
                  selo={SITUACOES_PEDIDO[pedido.status]}
                  selosExtras={pedidoTemDesconto(pedido) ? [{ texto: 'Desconto', tom: 'destaque' }] : undefined}
                  aoPressionar={function () {
                    router.push(`/pedidos/${pedido.id}`);
                  }}
                />
              </View>
            );
          }}
          cabecalho={painelFiltros}
          mensagemVazio="Nenhum pedido encontrado com esses filtros."
        />
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  cabecalho: {
    gap: 12,
    marginBottom: 12,
  },
  filtros: {
    gap: 12,
  },
  linha: {
    flexDirection: 'row',
    gap: 10,
  },
  metade: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  lista: {
    flex: 1,
  },
  item: {
    marginBottom: 10,
  },
});