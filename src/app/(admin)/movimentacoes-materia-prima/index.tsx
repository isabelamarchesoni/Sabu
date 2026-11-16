import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { listarMovimentacoesMaterial, formatarQuantidade, TIPOS_MOVIMENTACAO, type MovimentacaoMaterial } from '../../../services/estoque';
import { opcoesMateriasPrimas, type OpcaoMateriaPrima } from '../../../services/opcoes';
import { formatarDataHora } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Select from '../../../components/ui/Select';
import Chip from '../../../components/ui/Chip';
import PaginatedList from '../../../components/ui/PaginatedList';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';

export default function ListaMovimentacoesMateriaPrima() {
  const parametros = useLocalSearchParams<{ materia?: string; lote?: string }>();
  const [materias, setMaterias] = useState<OpcaoMateriaPrima[]>([]);
  const [materiaId, setMateriaId] = useState<number | null>(parametros.materia ? Number(parametros.materia) : null);
  const [loteId, setLoteId] = useState<number | null>(parametros.lote ? Number(parametros.lote) : null);

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

  function unidadeDe(movimentacao: MovimentacaoMaterial) {
    const materia = materias.find(function (opcao) {
      return opcao.valor === movimentacao.materia_prima;
    });
    return materia ? ` ${materia.unidade.toLowerCase()}` : '';
  }

  return (
    <Screen
      rodape={
        <Button
          titulo="Nova movimentação"
          icone="add"
          aoPressionar={function () {
            router.push((loteId ? `/movimentacoes-materia-prima/novo?lote=${loteId}` : '/movimentacoes-materia-prima/novo') as Href);
          }}
        />
      }
    >
      <Header titulo="Movimentações de matéria-prima" subtitulo="Entradas, uso na produção, ajustes e devoluções" voltar />

      <View style={estilos.filtros}>
        <Select
          rotulo="Matéria-prima"
          opcoes={materias}
          selecionados={materiaId === null ? [] : [materiaId]}
          aoMudar={function (valores) {
            setMateriaId(valores.length > 0 ? Number(valores[0]) : null);
            setLoteId(null);
          }}
          placeholder="Todas as matérias-primas"
        />
        {loteId !== null ? (
          <View style={estilos.chips}>
            <Chip
              rotulo={`Só o lote #${loteId}  ✕`}
              selecionado
              aoPressionar={function () {
                setLoteId(null);
              }}
            />
          </View>
        ) : null}
      </View>

      <View style={estilos.lista}>
        <PaginatedList
          carregar={function (pagina) {
            return listarMovimentacoesMaterial({ pagina: pagina, materiaPrimaId: materiaId, loteId: loteId });
          }}
          dependencias={[materiaId, loteId]}
          chave={function (movimentacao) {
            return String(movimentacao.id);
          }}
          renderizarItem={function (movimentacao) {
            const tipo = TIPOS_MOVIMENTACAO[movimentacao.tipo];
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={movimentacao.materia_prima_nome}
                  subtitulo={`${formatarDataHora(movimentacao.movimentado_em)} · lote ${movimentacao.numero_lote_fabricante}${movimentacao.fornecedor_nome ? ` · ${movimentacao.fornecedor_nome}` : ''}`}
                  detalhe={`${tipo.sinal}${formatarQuantidade(movimentacao.quantidade_movimentada)}${unidadeDe(movimentacao)}`}
                  selo={{ texto: tipo.texto, tom: tipo.tom }}
                  aoPressionar={function () {
                    router.push(`/lotes-materia-prima/${movimentacao.lote_materia_prima}` as Href);
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
    gap: 8,
  },
  lista: {
    flex: 1,
  },
  item: {
    marginBottom: 10,
  },
});
