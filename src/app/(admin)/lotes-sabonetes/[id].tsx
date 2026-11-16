// Detalhe do lote de sabonetes (/lotes-sabonetes/3). O id é o número do lote. Mostra saldo, datas e movimentações (entradas, vendas, ajustes).
import { useCallback, useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { TemaContext } from '../../../theme/TemaContext';
import { buscarLoteVariacao, listarMovimentacoesEstoque, SITUACOES_LOTE, TIPOS_MOVIMENTACAO, type LoteVariacao, type MovimentacaoEstoque } from '../../../services/estoque';
import { mensagemDeErro } from '../../../services/api';
import { formatarData, formatarDataHora } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Badge from '../../../components/ui/Badge';
import SectionTitle from '../../../components/ui/SectionTitle';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';
import ScreenState from '../../../components/ui/ScreenState';

export default function DetalheLoteSabonete() {
  const { cores } = useContext(TemaContext);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [lote, setLote] = useState<LoteVariacao | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [totalMovimentacoes, setTotalMovimentacoes] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

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
      const [dados, lista] = await Promise.all([buscarLoteVariacao(Number(id)), listarMovimentacoesEstoque({ pagina: 1, loteId: Number(id) })]);
      setLote(dados);
      setMovimentacoes(lista.results.slice(0, 10));
      setTotalMovimentacoes(lista.count);
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível carregar o lote.'));
    } finally {
      setCarregando(false);
    }
  }

  function tentarNovamente() {
    setCarregando(true);
    carregar();
  }

  function linha(rotulo: string, valor: string) {
    return (
      <View style={[estilos.linha, { borderColor: cores.borda }]}>
        <Text style={[estilos.rotulo, { color: cores.textoApoio }]}>{rotulo}</Text>
        <Text style={[estilos.valor, { color: cores.texto }]}>{valor}</Text>
      </View>
    );
  }

  if (carregando || !lote) {
    return (
      <Screen>
        <Header titulo="Lote de sabonetes" voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando lote…' : erro}
          aoTentarNovamente={carregando ? undefined : tentarNovamente}
        />
      </Screen>
    );
  }

  const situacao = SITUACOES_LOTE[lote.status];

  return (
    <Screen rolavel>
      <Header titulo="Lote de sabonetes" voltar />

      <View style={estilos.topo}>
        <Text style={[estilos.nome, { color: cores.texto }]}>{lote.numero_lote}</Text>
        <Badge texto={situacao.texto} tom={situacao.tom} />
      </View>

      <View style={[estilos.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
        {linha('Sabonete', `${lote.produto_nome} ${lote.variacao_nome}`)}
        {linha('SKU', lote.sku)}
        {linha('Saldo atual', `${lote.quantidade_atual} ${lote.quantidade_atual === 1 ? 'unidade' : 'unidades'}`)}
        {linha('Quantidade inicial', `${lote.quantidade_inicial} ${lote.quantidade_inicial === 1 ? 'unidade' : 'unidades'}`)}
        {linha('Fabricação', lote.data_fabricacao ? formatarData(lote.data_fabricacao) : 'Não informada')}
        {linha('Validade', formatarData(lote.data_validade))}
        {linha('Criado em', formatarDataHora(lote.criado_em))}
        {lote.observacao ? linha('Observação', lote.observacao) : null}
      </View>

      <View style={estilos.atalhos}>
        <Button
          titulo="Ver variação"
          variante="secundario"
          icone="pricetag-outline"
          aoPressionar={function () {
            router.push(`/variacoes/${lote.variacao}` as Href);
          }}
        />
      </View>

      <View style={estilos.secao}>
        <SectionTitle
          titulo={totalMovimentacoes > 10 ? `Movimentações (${totalMovimentacoes})` : 'Movimentações'}
          textoAcao="Nova"
          aoPressionarAcao={function () {
            router.push(`/movimentacoes-sabonetes/novo?lote=${lote.id}` as Href);
          }}
        />
        {movimentacoes.length > 0 ? (
          movimentacoes.map(function (movimentacao) {
            const tipo = TIPOS_MOVIMENTACAO[movimentacao.tipo];
            const pedido = movimentacao.pedido;
            return (
              <ListItem
                key={movimentacao.id}
                titulo={pedido ? `${tipo.texto} · pedido #${pedido}` : tipo.texto}
                subtitulo={`${formatarDataHora(movimentacao.movimentado_em)}${movimentacao.observacao ? ` · ${movimentacao.observacao}` : ''}`}
                detalhe={`${tipo.sinal}${movimentacao.quantidade_movimentada}`}
                aoPressionar={
                  pedido
                    ? function () {
                        router.push(`/pedidos/${pedido}` as Href);
                      }
                    : undefined
                }
              />
            );
          })
        ) : (
          <Text style={[estilos.vazio, { color: cores.textoApoio }]}>Lote vazio, sem movimentações.</Text>
        )}
        {totalMovimentacoes > 10 ? (
          <Button
            titulo="Ver todas as movimentações"
            variante="secundario"
            aoPressionar={function () {
              router.push(`/movimentacoes-sabonetes?lote=${lote.id}` as Href);
            }}
          />
        ) : null}
      </View>
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
    fontSize: 22,
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
  atalhos: {
    marginTop: 12,
  },
  secao: {
    marginTop: 24,
    marginBottom: 12,
    gap: 10,
  },
  vazio: {
    fontSize: 14,
  },
});
