import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { listarTiposPelePaginados } from '../../../services/catalogo';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import SearchField from '../../../components/ui/SearchField';
import Chip from '../../../components/ui/Chip';
import PaginatedList from '../../../components/ui/PaginatedList';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';

type Ordem = 'nome' | '-nome';

export default function ListaTiposPele() {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [ordem, setOrdem] = useState<Ordem>('nome');

  return (
    <Screen
      rodape={
        <Button
          titulo="Novo tipo de pele"
          icone="add"
          aoPressionar={function () {
            router.push('/tipos-pele/novo');
          }}
        />
      }
    >
      <Header titulo="Tipos de pele" subtitulo="Para qual pele cada sabonete é indicado" voltar />

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
        placeholder="Buscar tipo de pele"
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
            return listarTiposPelePaginados({ pagina: pagina, busca: buscaAplicada, ordenacao: ordem });
          }}
          dependencias={[buscaAplicada, ordem]}
          chave={function (tipo) {
            return String(tipo.id);
          }}
          renderizarItem={function (tipo) {
            return (
              <View style={estilos.item}>
                <ListItem
                  titulo={tipo.nome}
                  aoPressionar={function () {
                    router.push(`/tipos-pele/${tipo.id}`);
                  }}
                />
              </View>
            );
          }}
          mensagemVazio="Nenhum tipo de pele encontrado."
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