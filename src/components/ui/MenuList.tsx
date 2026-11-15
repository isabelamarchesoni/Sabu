import { StyleSheet, View } from 'react-native';
import { router, type Href } from 'expo-router';
import ListItem from './ListItem';

export type ItemMenu = { titulo: string; subtitulo: string; rota: string };

type Props = { itens: ItemMenu[] };

export default function MenuList({ itens }: Props) {
  return (
    <View style={estilos.lista}>
      {itens.map(function (item) { return <ListItem key={item.rota} titulo={item.titulo} subtitulo={item.subtitulo} aoPressionar={function () { router.push(item.rota as Href); }} />; })}
    </View>
  );
}

const estilos = StyleSheet.create({
  lista: {
    gap: 10,
  },
});