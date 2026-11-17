import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { listarLotesVariacao, SITUACOES_LOTE, type LoteVariacao, type StatusLote } from '../../../services/estoque';
import { opcoesVariacoes, type OpcaoVariacao } from '../../../services/opcoes';
import { formatarData } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Select from '../../../components/ui/Select';
import Chip from '../../../components/ui/Chip';
import PaginatedList from '../../../components/ui/PaginatedList';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';

const SITUACOES: { valor: StatusLote | null; rotulo: string }[] = [
  { valor: null, rotulo: 'Todos' },
  { valor: 'ATIVO', rotulo: 'Ativos' },
  { valor: 'ESGOTADO', rotulo: 'Esgotados' },
  { valor: 'VENCIDO', rotulo: 'Vencidos' },
];

function subtitulo(lote: LoteVariacao) {
  const unidades = `${lote.quantidade_atual} de ${lote.quantidade_inicial} ${lote.quantidade_inicial === 1 ? 'unidade' : 'unidades'}`;
  return `${lote.produto_nome} ${lote.variacao_nome} · ${unidades} · validade ${formatarData(lote.data_validade)}`;
}

export default function ListaLotesSabonetes() {
  const parametros = useLocalSearchParams<{ variacao?: string }>();
  const [variacoes, setVariacoes] = useState<OpcaoVariacao[]>([]);
  const [variacaoId, setVariacaoId] = useState<number | null>(parametros.variacao ? Number(parametros.variacao) : null);
  const [status, setStatus] = useState<StatusLote | null>(null);

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

  return (
    <Screen
      rodape={
        <Button
          titulo="Novo lote"
          icone="add"
          aoPressionar={function () {
            router.push((variacaoId ? `/lotes-sabonetes/novo?variacao=${variacaoId}` : '/lotes-sabonetes/novo') as Href);
          }}
        />
      }
    >
      <Header titulo="Lotes de sabonetes" subtitulo="Sabonetes fabricados, saldo e validade" voltar />

      <View style={estilos.filtros}>
        <Select
          rotulo="Variação"
          opcoes={variacoes}
          selecionados={variacaoId === null ? [] : [variacaoId]}
          aoMudar={function (valores) {
            setVariacaoId(valores.length > 0 ? Number(valores[0]) : null);
          }}
          placeholder="Todas as variações"
        />
        <View style={estilos.chips}>
          {SITUACOES.map(function (opcao) {
            return (
              <Chip
                key={opcao.rotulo}
                rotulo={opcao.rotulo}
                selecionado={status === opcao.valor}
                aoPressionar={function () {
                  setStatus(opcao.valor);
                }}
              />
            );
          })}
        </View>
      </View>

      <View style={estilos.lista}>
        <PaginatedList
          carregar={function (pagina) {
            return listarLotesVariacao({ pagina: pagina, variacaoId: variacaoId, status: status });
          }}
          dependencias={[variacaoId, status]}
          chave={function (lote) {
            return String(lote.id);
          }}
          renderizarItem={function (lote) {
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={lote.numero_lote}
                  subtitulo={subtitulo(lote)}
                  selo={SITUACOES_LOTE[lote.status]}
                  aoPressionar={function () {
                    router.push(`/lotes-sabonetes/${lote.id}` as Href);
                  }}
                />
              </View>
            );
          }}
          mensagemVazio="Nenhum lote encontrado."
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
