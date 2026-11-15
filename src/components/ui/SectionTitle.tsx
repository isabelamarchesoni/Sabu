import { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TemaContext } from '../../theme/TemaContext';

type Props = {
  titulo: string;
  textoAcao?: string;
  aoPressionarAcao?: () => void;
};

export default function SectionTitle({ titulo, textoAcao, aoPressionarAcao }: Props) {
  const { cores } = useContext(TemaContext);

  return (
    <View style={styles.linha}>
      <Text style={[styles.titulo, { color: cores.texto }]}>{titulo}</Text>
      {textoAcao && aoPressionarAcao && (
        <TouchableOpacity onPress={aoPressionarAcao} style={styles.acao} accessibilityRole="button">
          <Text style={[styles.textoAcao, { color: cores.link }]}>{textoAcao}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '600',
  },
  acao: {
    minHeight: 44,
    justifyContent: 'center',
  },
  textoAcao: {
    fontSize: 14,
    fontWeight: '600',
  },
});