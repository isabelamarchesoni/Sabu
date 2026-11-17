// Detalhe do lote de matéria-prima (/lotes-materia-prima/3). O id é o número do lote. Mostra saldo, validade, origem e movimentações.
import { useCallback, useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { TemaContext } from '../../../theme/TemaContext';
import { buscarLoteMateriaPrima, buscarMateriaPrima, listarMovimentacoesMaterial, formatarQuantidade, SITUACOES_LOTE, TIPOS_MOVIMENTACAO, type LoteMateriaPrima, type MateriaPrima, type MovimentacaoMaterial } from '../../../services/estoque';
import { mensagemDeErro } from '../../../services/api';
import { formatarData, formatarDataHora } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Badge from '../../../components/ui/Badge';
import SectionTitle from '../../../components/ui/SectionTitle';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';
import ScreenState from '../../../components/ui/ScreenState';

export default function DetalheLoteMateriaPrima() {
  const { cores } = useContext(TemaContext);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [lote, setLote] = useState<LoteMateriaPrima | null>(null);
  const [materia, setMateria] = useState<MateriaPrima | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoMaterial[]>([]);
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
      const [dados, lista] = await Promise.all([buscarLoteMateriaPrima(Number(id)), listarMovimentacoesMaterial({ pagina: 1, loteId: Number(id) })]);
      setLote(dados);
      setMovimentacoes(lista.results.slice(0, 10));
      setTotalMovimentacoes(lista.count);
      setMateria(await buscarMateriaPrima(dados.materia_prima));
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
        <Header titulo="Lote de matéria-prima" voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando lote…' : erro}
          aoTentarNovamente={carregando ? undefined : tentarNovamente}
        />
      </Screen>
    );
  }

  const unidade = materia ? materia.unidade_medida.toLowerCase() : '';
  const situacao = SITUACOES_LOTE[lote.status];

  return (
    <Screen rolavel>
      <Header titulo="Lote de matéria-prima" voltar />

      <View style={estilos.topo}>
        <Text style={[estilos.nome, { color: cores.texto }]}>{lote.numero_lote_fabricante || `Lote #${lote.id}`}</Text>
        <Badge texto={situacao.texto} tom={situacao.tom} />
      </View>

      <View style={[estilos.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
        {linha('Matéria-prima', `${lote.materia_prima_nome} · ${lote.sku}`)}
        {linha('Saldo atual', `${formatarQuantidade(lote.quantidade_atual)} ${unidade}`)}
        {linha('Quantidade inicial', `${formatarQuantidade(lote.quantidade_inicial)} ${unidade}`)}
        {linha('Validade', lote.data_validade ? formatarData(lote.data_validade) : 'Sem validade')}
        {linha('Origem', lote.compra_fornecedor_item ? 'Compra de fornecedor' : 'Lote criado à mão')}
        {linha('Criado em', formatarDataHora(lote.criado_em))}
        {lote.observacao ? linha('Observação', lote.observacao) : null}
      </View>

      <View style={estilos.atalhos}>
        <Button
          titulo="Ver matéria-prima"
          variante="secundario"
          icone="flask-outline"
          aoPressionar={function () {
            router.push(`/materias-primas/${lote.materia_prima}`);
          }}
        />
      </View>

      <View style={estilos.secao}>
        <SectionTitle
          titulo={totalMovimentacoes > 10 ? `Movimentações (${totalMovimentacoes})` : 'Movimentações'}
          textoAcao="Nova"
          aoPressionarAcao={function () {
            router.push(`/movimentacoes-materia-prima/novo?lote=${lote.id}` as Href);
          }}
        />
        {movimentacoes.length > 0 ? (
          movimentacoes.map(function (movimentacao) {
            const tipo = TIPOS_MOVIMENTACAO[movimentacao.tipo];
            return (
              <ListItem
                key={movimentacao.id}
                titulo={tipo.texto}
                subtitulo={`${formatarDataHora(movimentacao.movimentado_em)}${movimentacao.fornecedor_nome ? ` · ${movimentacao.fornecedor_nome}` : ''}${movimentacao.observacao ? ` · ${movimentacao.observacao}` : ''}`}
                detalhe={`${tipo.sinal}${formatarQuantidade(movimentacao.quantidade_movimentada)} ${unidade}`}
              />
            );
          })
        ) : (
          <Text style={[estilos.vazio, { color: cores.textoApoio }]}>Lote vazio, sem movimentações. Registre uma entrada para abastecê-lo.</Text>
        )}
        {totalMovimentacoes > 10 ? (
          <Button
            titulo="Ver todas as movimentações"
            variante="secundario"
            aoPressionar={function () {
              router.push(`/movimentacoes-materia-prima?lote=${lote.id}` as Href);
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
