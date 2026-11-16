import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { listarVinculos, opcoesFornecedores } from '../../../services/compras';
import { formatarCusto } from '../../../services/estoque';
import { opcoesMateriasPrimas, type OpcaoMateriaPrima } from '../../../services/opcoes';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Select from '../../../components/ui/Select';
import Chip from '../../../components/ui/Chip';
import PaginatedList from '../../../components/ui/PaginatedList';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';

type Situacao = 'ativos' | 'apagados' | 'todos';

const SITUACOES: { valor: Situacao; rotulo: string }[] = [
  { valor: 'ativos', rotulo: 'Ativos' },
  { valor: 'apagados', rotulo: 'Apagados' },
  { valor: 'todos', rotulo: 'Todos' },
];

export default function ListaVinculos() {
  const parametros = useLocalSearchParams<{ materia?: string }>();
  const [materias, setMaterias] = useState<OpcaoMateriaPrima[]>([]);
  const [fornecedores, setFornecedores] = useState<{ valor: number; rotulo: string }[]>([]);
  const [materiaId, setMateriaId] = useState<number | null>(parametros.materia ? Number(parametros.materia) : null);
  const [situacao, setSituacao] = useState<Situacao>('ativos');

  useEffect(function () {
    carregarOpcoes();
  }, []);

  async function carregarOpcoes() {
    try {
      const [listaMaterias, listaFornecedores] = await Promise.all([opcoesMateriasPrimas(), opcoesFornecedores()]);
      setMaterias(listaMaterias);
      setFornecedores(listaFornecedores);
    } catch {
      setMaterias([]);
      setFornecedores([]);
    }
  }

  const nomes: Record<number, string> = {};
  fornecedores.forEach(function (opcao) {
    nomes[opcao.valor] = opcao.rotulo.replace('★ ', '');
  });

  return (
    <Screen
      rodape={
        <Button
          titulo="Novo vínculo"
          icone="add"
          aoPressionar={function () {
            router.push((materiaId ? `/vinculos/novo?materia=${materiaId}` : '/vinculos/novo') as Href);
          }}
        />
      }
    >
      <Header titulo="Vínculos" subtitulo="Qual fornecedor vende cada matéria-prima e por quanto" voltar />

      <View style={estilos.filtros}>
        <Select
          rotulo="Matéria-prima"
          opcoes={materias}
          selecionados={materiaId === null ? [] : [materiaId]}
          aoMudar={function (valores) {
            setMateriaId(valores.length > 0 ? Number(valores[0]) : null);
          }}
          placeholder="Todas as matérias-primas"
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
            return listarVinculos({
              pagina: pagina,
              materiaPrimaId: materiaId,
              apagados: situacao === 'ativos' ? false : situacao === 'apagados' ? true : null,
            });
          }}
          dependencias={[materiaId, situacao]}
          chave={function (vinculo) {
            return String(vinculo.id);
          }}
          renderizarItem={function (vinculo) {
            const unidade = vinculo.materia_prima.unidade_medida.toLowerCase();
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={vinculo.materia_prima.nome}
                  subtitulo={`${nomes[vinculo.fornecedor] ?? `Fornecedor ${vinculo.fornecedor}`}${vinculo.sku_materia_prima_fornecedor ? ` · código ${vinculo.sku_materia_prima_fornecedor}` : ''}`}
                  detalhe={`${formatarCusto(vinculo.custo_unitario_fornecedor)}/${unidade}`}
                  selo={vinculo.apagado_em ? { texto: 'Apagado', tom: 'erro' } : undefined}
                  aoPressionar={function () {
                    router.push(`/vinculos/${vinculo.id}` as Href);
                  }}
                />
              </View>
            );
          }}
          mensagemVazio="Nenhum vínculo encontrado."
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
