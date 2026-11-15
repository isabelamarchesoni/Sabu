import { useContext, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';

type Props = {
  titulo: string;
  subtitulo?: string;
  voltar?: boolean;
  acoes?: ReactNode;
  grande?: boolean;
};

export default function Header({ titulo, subtitulo, voltar = false, acoes, grande = false }: Props) {
  const { cores } = useContext(TemaContext);

  function voltarTela() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  return (
    <View style={styles.cabecalho}>
      {voltar && (
        <TouchableOpacity style={[styles.botaoVoltar, { backgroundColor: cores.cartao, borderColor: cores.borda }]} onPress={voltarTela} accessibilityLabel="Voltar">
          <Ionicons name="chevron-back" size={22} color={cores.texto} />
        </TouchableOpacity>
      )}

      <View style={styles.titulos}>
        <Text style={[grande ? styles.tituloGrande : styles.titulo, { color: cores.texto }]} numberOfLines={1}>
          {titulo}
        </Text>
        {subtitulo && <Text style={[styles.subtitulo, { color: cores.textoApoio }]}>{subtitulo}</Text>}
      </View>

      {acoes && <View style={styles.acoes}>{acoes}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    minHeight: 48,
  },
  botaoVoltar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulos: {
    flex: 1,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '600',
  },
  tituloGrande: {
    fontSize: 28,
    fontWeight: '600',
  },
  subtitulo: {
    fontSize: 14,
    marginTop: 2,
  },
  acoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});