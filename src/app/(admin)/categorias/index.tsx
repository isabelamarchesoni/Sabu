import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { listarCategoriasPaginadas } from '../../../services/catalogo';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import SearchField from '../../../components/ui/SearchField';
import Chip from '../../../components/ui/Chip';
import PaginatedList from '../../../components/ui/PaginatedList';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';

type Ordem = 'nome' | '-nome';

export default function ListaCategorias() {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [ordem, setOrdem] = useState<Ordem>('nome');

  return (
    <Screen
      rodape={
        <Button
          titulo="Nova categoria"
          icone="add"
          aoPressionar={function () {
            router.push('/categorias/novo');
          }}
        />
      }
    >
      <Header titulo="Categorias" subtitulo="Grupos usados para filtrar a vitrine" voltar />

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
        placeholder="Buscar categoria"
      />

      <View style={estilos.ordem}>
        <Chip
          rotulo="A → Z"
          selecionado={ordem === 'nome'}
          aoPressionar={function () {
            setOrdem('nome');
          }}
        />
        <Chip
          rotulo="Z → A"
          selecionado={ordem === '-nome'}
          aoPressionar={function () {
            setOrdem('-nome');
          }}
        />
      </View>

      <View style={estilos.lista}>
        <PaginatedList
          carregar={function (pagina) {
            return listarCategoriasPaginadas({ pagina: pagina, busca: buscaAplicada, ordenacao: ordem });
          }}
          dependencias={[buscaAplicada, ordem]}
          chave={function (categoria) {
            return String(categoria.id);
          }}
          renderizarItem={function (categoria) {
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={categoria.nome}
                  aoPressionar={function () {
                    router.push(`/categorias/${categoria.id}`);
                  }}
                />
              </View>
            );
          }}
          mensagemVazio="Nenhuma categoria encontrada."
        />
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  ordem: {
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