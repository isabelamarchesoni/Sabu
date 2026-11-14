import { View, Text, StyleSheet } from 'react-native';

export default function Inicio() {
  return (
    <View style={styles.tela}>
      <Text style={styles.titulo}>Sabu</Text>
      <Text style={styles.subtitulo}>Gestão de estoque de sabonetes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#E8DCC4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B2F2A',
  },
  subtitulo: {
    fontSize: 16,
    color: '#7A6A5F',
    marginTop: 8,
  },
});