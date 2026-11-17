import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { listarIngredientesPaginados } from '../../../services/catalogo';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import SearchField from '../../../components/ui/SearchField';
import PaginatedList from '../../../components/ui/PaginatedList';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';

export default function ListaIngredientes() {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');

  return (
    <Screen
      rodape={
        <Button
          titulo="Novo ingrediente"
          icone="add"
          aoPressionar={function () {
            router.push('/ingredientes/novo');
          }}
        />
      }
    >
      <Header titulo="Ingredientes" subtitulo="Usados pelo quiz para respeitar alergias" voltar />

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
        placeholder="Buscar ingrediente"
      />

      <View style={estilos.lista}>
        <PaginatedList
          carregar={function (pagina) {
            return listarIngredientesPaginados({ pagina: pagina, busca: buscaAplicada });
          }}
          dependencias={[buscaAplicada]}
          chave={function (ingrediente) {
            return String(ingrediente.id);
          }}
          renderizarItem={function (ingrediente) {
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={ingrediente.nome}
                  aoPressionar={function () {
                    router.push(`/ingredientes/${ingrediente.id}`);
                  }}
                />
              </View>
            );
          }}
          mensagemVazio="Nenhum ingrediente encontrado."
        />
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  lista: {
    flex: 1,
    marginTop: 12,
  },
  item: {
    marginBottom: 10,
  },
});
