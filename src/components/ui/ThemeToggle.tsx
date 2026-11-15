import { useContext } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';

export default function ThemeToggle() {
  const { cores, modoEscuro, alternarTema } = useContext(TemaContext);

  return (
    <TouchableOpacity style={[styles.botao, { backgroundColor: cores.cartao, borderColor: cores.borda }]} onPress={alternarTema} accessibilityLabel={modoEscuro ? 'Ativar modo claro' : 'Ativar modo escuro'}>
      <Ionicons name={modoEscuro ? 'sunny-outline' : 'moon-outline'} size={22} color={cores.texto} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});