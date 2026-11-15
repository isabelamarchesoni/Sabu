import { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';

type Props = {
  mensagem: string;
  tom?: 'erro' | 'sucesso';
};

export default function Notice({ mensagem, tom = 'erro' }: Props) {
  const { cores } = useContext(TemaContext);
  const cor = tom === 'erro' ? cores.erro : cores.sucesso;

  return (
    <View style={[styles.aviso, { backgroundColor: cores.superficie, borderColor: cor }]} accessibilityRole="alert">
      <Ionicons name={tom === 'erro' ? 'alert-circle-outline' : 'checkmark-circle-outline'} size={20} color={cor} />
      <Text style={[styles.texto, { color: cores.texto }]}>{mensagem}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  texto: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});