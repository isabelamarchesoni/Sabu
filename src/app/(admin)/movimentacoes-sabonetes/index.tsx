import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { listarMovimentacoesEstoque, TIPOS_MOVIMENTACAO } from '../../../services/estoque';
import { opcoesVariacoes, type OpcaoVariacao } from '../../../services/opcoes';
import { formatarDataHora } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Select from '../../../components/ui/Select';
import Chip from '../../../components/ui/Chip';
import PaginatedList from '../../../components/ui/PaginatedList';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';

export default function ListaMovimentacoesSabonetes() {
  const parametros = useLocalSearchParams<{ variacao?: string; lote?: string; pedido?: string }>();
  const [variacoes, setVariacoes] = useState<OpcaoVariacao[]>([]);
  const [variacaoId, setVariacaoId] = useState<number | null>(parametros.variacao ? Number(parametros.variacao) : null);
  const [loteId, setLoteId] = useState<number | null>(parametros.lote ? Number(parametros.lote) : null);
  const [pedidoId, setPedidoId] = useState<number | null>(parametros.pedido ? Number(parametros.pedido) : null);

  useEffect(function () {
    carregarVariacoes();
  }, []);

  async function carregarVariacoes() {
    try {
      setVariacoes(await opcoesVariacoes());
    } catch {
      setVariacoes([]);
    }
  }

  async function carregar(pagina: number) {
    const resposta = await listarMovimentacoesEstoque({ pagina: pagina, variacaoId: variacaoId, loteId: loteId });
    if (pedidoId === null) {
      return resposta;
    }
    return {
      ...resposta,
      results: resposta.results.filter(function (movimentacao) {
        return movimentacao.pedido === pedidoId;
      }),
    };
  }

  return (
    <Screen
      rodape={
        <Button
          titulo="Nova movimentação"
          icone="add"
          aoPressionar={function () {
            router.push((loteId ? `/movimentacoes-sabonetes/novo?lote=${loteId}` : variacaoId ? `/movimentacoes-sabonetes/novo?variacao=${variacaoId}` : '/movimentacoes-sabonetes/novo') as Href);
          }}
        />
      }
    >
      <Header titulo="Movimentações de sabonetes" subtitulo="Entradas, vendas, ajustes e estornos" voltar />

      <View style={estilos.filtros}>
        <Select
          rotulo="Variação"
          opcoes={variacoes}
          selecionados={variacaoId === null ? [] : [variacaoId]}
          aoMudar={function (valores) {
            setVariacaoId(valores.length > 0 ? Number(valores[0]) : null);
            setLoteId(null);
          }}
          placeholder="Todas as variações"
        />
        {loteId !== null || pedidoId !== null ? (
          <View style={estilos.chips}>
            {loteId !== null ? (
              <Chip
                rotulo={`Só o lote #${loteId}  ✕`}
                selecionado
                aoPressionar={function () {
                  setLoteId(null);
                }}
              />
            ) : null}
            {pedidoId !== null ? (
              <Chip
                rotulo={`Só o pedido #${pedidoId}  ✕`}
                selecionado
                aoPressionar={function () {
                  setPedidoId(null);
                }}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={estilos.lista}>
        <PaginatedList
          carregar={carregar}
          dependencias={[variacaoId, loteId, pedidoId]}
          chave={function (movimentacao) {
            return String(movimentacao.id);
          }}
          renderizarItem={function (movimentacao) {
            const tipo = TIPOS_MOVIMENTACAO[movimentacao.tipo];
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={`${movimentacao.produto_nome} ${movimentacao.variacao_nome}`}
                  subtitulo={`${formatarDataHora(movimentacao.movimentado_em)} · lote ${movimentacao.numero_lote}${movimentacao.pedido ? ` · pedido #${movimentacao.pedido}` : ''}`}
                  detalhe={`${tipo.sinal}${movimentacao.quantidade_movimentada}`}
                  selo={{ texto: tipo.texto, tom: tipo.tom }}
                  aoPressionar={function () {
                    router.push(`/lotes-sabonetes/${movimentacao.lote_produto_variacao}` as Href);
                  }}
                />
              </View>
            );
          }}
          mensagemVazio="Nenhuma movimentação encontrada."
        />
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  filtros: {
    gap: 12,
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lista: {
    flex: 1,
  },
  item: {
    marginBottom: 10,
  },
});
