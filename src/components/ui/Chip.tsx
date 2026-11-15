import { useContext } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { TemaContext } from '../../theme/TemaContext';

type Props = {
  rotulo: string;
  selecionado: boolean;
  aoPressionar: () => void;
};

export default function Chip({ rotulo, selecionado, aoPressionar }: Props) {
  const { cores } = useContext(TemaContext);

  return (
    <TouchableOpacity
      style={[styles.chip, selecionado ? { backgroundColor: cores.botao, borderColor: cores.botao } : { backgroundColor: 'transparent', borderColor: cores.bordaForte }]}
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityState={{ selected: selecionado }}
    >
      <Text style={[styles.texto, { color: selecionado ? cores.botaoTexto : cores.texto }]}>{rotulo}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  texto: {
    fontSize: 14,
    fontWeight: '500',
  },
});