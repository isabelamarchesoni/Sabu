import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { listarCompras, opcoesFornecedores, SITUACOES_COMPRA, type StatusCompra } from '../../../services/compras';
import { formatarCusto } from '../../../services/estoque';
import { formatarData } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Select from '../../../components/ui/Select';
import Chip from '../../../components/ui/Chip';
import PaginatedList from '../../../components/ui/PaginatedList';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';

const SITUACOES: { valor: StatusCompra | null; rotulo: string }[] = [
  { valor: null, rotulo: 'Todas' },
  { valor: 'CONCLUIDO', rotulo: 'Concluídas' },
  { valor: 'DEVOLVIDO', rotulo: 'Devolvidas' },
];

export default function ListaCompras() {
  const parametros = useLocalSearchParams<{ fornecedor?: string }>();
  const [fornecedores, setFornecedores] = useState<{ valor: number; rotulo: string }[]>([]);
  const [fornecedorId, setFornecedorId] = useState<number | null>(parametros.fornecedor ? Number(parametros.fornecedor) : null);
  const [status, setStatus] = useState<StatusCompra | null>(null);

  useEffect(function () {
    carregarFornecedores();
  }, []);

  async function carregarFornecedores() {
    try {
      setFornecedores(await opcoesFornecedores());
    } catch {
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
          titulo="Nova compra"
          icone="add"
          aoPressionar={function () {
            router.push((fornecedorId ? `/historico-compras/novo?fornecedor=${fornecedorId}` : '/historico-compras/novo') as Href);
          }}
        />
      }
    >
      <Header titulo="Compras realizadas" subtitulo="Entradas de matéria-prima e devoluções" voltar />

      <View style={estilos.filtros}>
        <Select
          rotulo="Fornecedor"
          opcoes={fornecedores}
          selecionados={fornecedorId === null ? [] : [fornecedorId]}
          aoMudar={function (valores) {
            setFornecedorId(valores.length > 0 ? Number(valores[0]) : null);
          }}
          placeholder="Todos os fornecedores"
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
            return listarCompras({ pagina: pagina, fornecedorId: fornecedorId, status: status });
          }}
          dependencias={[fornecedorId, status]}
          chave={function (compra) {
            return String(compra.id);
          }}
          renderizarItem={function (compra) {
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={nomes[compra.fornecedor] ?? `Fornecedor ${compra.fornecedor}`}
                  subtitulo={`Compra #${compra.id} · ${formatarData(compra.compra_realizada_em)} · ${compra.itens.length} ${compra.itens.length === 1 ? 'item' : 'itens'}`}
                  detalhe={formatarCusto(compra.valor_total)}
                  selo={SITUACOES_COMPRA[compra.status]}
                  aoPressionar={function () {
                    router.push(`/historico-compras/${compra.id}` as Href);
                  }}
                />
              </View>
            );
          }}
          mensagemVazio="Nenhuma compra encontrada."
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
