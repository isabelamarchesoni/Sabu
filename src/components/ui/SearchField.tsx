import { useContext } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';

type Props = {
  valor: string;
  aoMudar: (texto: string) => void;
  aoBuscar: () => void;
  aoLimpar: () => void;
  placeholder?: string;
};

export default function SearchField({ valor, aoMudar, aoBuscar, aoLimpar, placeholder = 'Buscar' }: Props) {
  const { cores } = useContext(TemaContext);

  return (
    <View style={[styles.caixa, { backgroundColor: cores.campo, borderColor: cores.borda }]}>
      <Ionicons name="search-outline" size={20} color={cores.textoApoio} />
      <TextInput
        style={[styles.entrada, { color: cores.texto }]}
        value={valor}
        onChangeText={aoMudar}
        placeholder={placeholder}
        placeholderTextColor={cores.placeholder}
        returnKeyType="search"
        onSubmitEditing={aoBuscar}
        accessibilityLabel={placeholder}
      />
      {valor !== '' && (
        <TouchableOpacity style={styles.botaoLimpar} onPress={aoLimpar} accessibilityLabel="Limpar busca">
          <Ionicons name="close-circle" size={20} color={cores.textoApoio} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    gap: 8,
    marginBottom: 12,
  },
  entrada: {
    flex: 1,
    height: 48,
    fontSize: 15,
  },
  botaoLimpar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});