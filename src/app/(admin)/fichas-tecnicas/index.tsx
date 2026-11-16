import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { listarFichas, formatarQuantidade } from '../../../services/estoque';
import { opcoesVariacoes, type OpcaoVariacao } from '../../../services/opcoes';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Select from '../../../components/ui/Select';
import Chip from '../../../components/ui/Chip';
import PaginatedList from '../../../components/ui/PaginatedList';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';

type Situacao = 'ativas' | 'apagadas' | 'todas';

const SITUACOES: { valor: Situacao; rotulo: string }[] = [
  { valor: 'ativas', rotulo: 'Ativas' },
  { valor: 'apagadas', rotulo: 'Apagadas' },
  { valor: 'todas', rotulo: 'Todas' },
];

export default function ListaFichasTecnicas() {
  const parametros = useLocalSearchParams<{ variacao?: string }>();
  const [variacoes, setVariacoes] = useState<OpcaoVariacao[]>([]);
  const [variacaoId, setVariacaoId] = useState<number | null>(parametros.variacao ? Number(parametros.variacao) : null);
  const [situacao, setSituacao] = useState<Situacao>('ativas');

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

  const nomes: Record<number, string> = {};
  variacoes.forEach(function (opcao) {
    nomes[opcao.valor] = opcao.rotulo;
  });

  return (
    <Screen
      rodape={
        <Button
          titulo="Nova ficha técnica"
          icone="add"
          aoPressionar={function () {
            router.push((variacaoId ? `/fichas-tecnicas/novo?variacao=${variacaoId}` : '/fichas-tecnicas/novo') as Href);
          }}
        />
      }
    >
      <Header titulo="Fichas técnicas" subtitulo="Quanto de cada matéria-prima vai em um sabonete" voltar />

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
                key={opcao.valor}
                rotulo={opcao.rotulo}
                selecionado={situacao === opcao.valor}
                aoPressionar={function () {
                  setSituacao(opcao.valor);
                }}
              />
            );
          })}
        </View>
      </View>

      <View style={estilos.lista}>
        <PaginatedList
          carregar={function (pagina) {
            return listarFichas({
              pagina: pagina,
              variacaoId: variacaoId,
              apagadas: situacao === 'ativas' ? false : situacao === 'apagadas' ? true : null,
            });
          }}
          dependencias={[variacaoId, situacao]}
          chave={function (ficha) {
            return String(ficha.id);
          }}
          renderizarItem={function (ficha) {
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={ficha.materia_prima.nome}
                  subtitulo={`${nomes[ficha.variacao] ?? `Variação ${ficha.variacao}`} · ${formatarQuantidade(ficha.quantidade_necessaria)} ${ficha.materia_prima.unidade_medida.toLowerCase()} por sabonete`}
                  selo={ficha.apagada_em ? { texto: 'Apagada', tom: 'erro' } : undefined}
                  aoPressionar={function () {
                    router.push(`/fichas-tecnicas/${ficha.id}`);
                  }}
                />
              </View>
            );
          }}
          mensagemVazio="Nenhuma ficha técnica encontrada."
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
    gap: 8,
  },
  lista: {
    flex: 1,
  },
  item: {
    marginBottom: 10,
  },
});
