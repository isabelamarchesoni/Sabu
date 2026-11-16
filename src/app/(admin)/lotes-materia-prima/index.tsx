import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { listarLotesMateriaPrima, formatarQuantidade, SITUACOES_LOTE, type LoteMateriaPrima, type StatusLote } from '../../../services/estoque';
import { opcoesMateriasPrimas, type OpcaoMateriaPrima } from '../../../services/opcoes';
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

export default function ListaLotesMateriaPrima() {
  const parametros = useLocalSearchParams<{ materia?: string }>();
  const [materias, setMaterias] = useState<OpcaoMateriaPrima[]>([]);
  const [materiaId, setMateriaId] = useState<number | null>(parametros.materia ? Number(parametros.materia) : null);
  const [status, setStatus] = useState<StatusLote | null>(null);

  useEffect(function () {
    carregarMaterias();
  }, []);

  async function carregarMaterias() {
    try {
      setMaterias(await opcoesMateriasPrimas());
    } catch {
      setMaterias([]);
    }
  }

  function subtitulo(lote: LoteMateriaPrima) {
    const materia = materias.find(function (opcao) {
      return opcao.valor === lote.materia_prima;
    });
    const unidade = materia ? ` ${materia.unidade.toLowerCase()}` : '';
    const validade = lote.data_validade ? `validade ${formatarData(lote.data_validade)}` : 'sem validade';
    return `${lote.materia_prima_nome} · ${formatarQuantidade(lote.quantidade_atual)}${unidade} · ${validade}`;
  }

  return (
    <Screen
      rodape={
        <Button
          titulo="Novo lote"
          icone="add"
          aoPressionar={function () {
            router.push((materiaId ? `/lotes-materia-prima/novo?materia=${materiaId}` : '/lotes-materia-prima/novo') as Href);
          }}
        />
      }
    >
      <Header titulo="Lotes de matéria-prima" subtitulo="Quantidade e validade de cada entrada" voltar />

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
            return listarLotesMateriaPrima({ pagina: pagina, materiaPrimaId: materiaId, status: status });
          }}
          dependencias={[materiaId, status]}
          chave={function (lote) {
            return String(lote.id);
          }}
          renderizarItem={function (lote) {
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={lote.numero_lote_fabricante || `Lote #${lote.id}`}
                  subtitulo={subtitulo(lote)}
                  selo={SITUACOES_LOTE[lote.status]}
                  aoPressionar={function () {
                    router.push(`/lotes-materia-prima/${lote.id}` as Href);
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
