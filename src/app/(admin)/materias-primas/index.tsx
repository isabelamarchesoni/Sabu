import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { listarMateriasPrimas, rotuloTipo, formatarQuantidade, formatarCusto, type MateriaPrima } from '../../../services/estoque';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import SearchField from '../../../components/ui/SearchField';
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

function subtitulo(materia: MateriaPrima) {
  return `${materia.sku} · ${rotuloTipo(materia.tipo)} · estoque ${formatarQuantidade(materia.quantidade_estoque)} ${materia.unidade_medida.toLowerCase()}`;
}

export default function ListaMateriasPrimas() {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [situacao, setSituacao] = useState<Situacao>('ativas');

  return (
    <Screen
      rodape={
        <Button
          titulo="Nova matéria-prima"
          icone="add"
          aoPressionar={function () {
            router.push('/materias-primas/formulario/novo');
          }}
        />
      }
    >
      <Header titulo="Matérias-primas" subtitulo="Ingredientes, materiais e estoque" voltar />

      <SearchField
        valor={busca}
        aoMudar={setBusca}
        aoBuscar={function () {
          setBuscaAplicada(busca.trim());
        }}
        aoLimpar={function () {
          setBusca('');
          setBuscaAplicada('');
        }}
        placeholder="Buscar por nome ou SKU"
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

      <View style={estilos.lista}>
        <PaginatedList
          carregar={function (pagina) {
            return listarMateriasPrimas({
              pagina: pagina,
              busca: buscaAplicada,
              apagadas: situacao === 'ativas' ? false : situacao === 'apagadas' ? true : null,
            });
          }}
          dependencias={[buscaAplicada, situacao]}
          chave={function (materia) {
            return String(materia.id);
          }}
          renderizarItem={function (materia) {
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={materia.nome}
                  subtitulo={subtitulo(materia)}
                  detalhe={`${formatarCusto(materia.custo_unitario_referencia)}/${materia.unidade_medida.toLowerCase()}`}
                  selo={materia.apagada_em ? { texto: 'Apagada', tom: 'erro' } : undefined}
                  aoPressionar={function () {
                    router.push(`/materias-primas/${materia.id}`);
                  }}
                />
              </View>
            );
          }}
          mensagemVazio="Nenhuma matéria-prima encontrada."
        />
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  lista: {
    flex: 1,
  },
  item: {
    marginBottom: 10,
  },
});
