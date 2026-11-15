import { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';
import Badge, { type TomBadge } from './Badge';

type Props = {
  titulo: string;
  subtitulo?: string;
  detalhe?: string;
  selo?: { texto: string; tom?: TomBadge };
  aoPressionar?: () => void;
};

export default function ListItem({ titulo, subtitulo, detalhe, selo, aoPressionar }: Props) {
  const { cores } = useContext(TemaContext);

  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: cores.cartao, borderColor: cores.borda, boxShadow: `0px 2px 10px ${cores.sombraCartao}` }]}
      onPress={aoPressionar}
      disabled={!aoPressionar}
      accessibilityRole="button"
    >
      <View style={styles.textos}>
        <Text style={[styles.titulo, { color: cores.texto }]} numberOfLines={1}>
          {titulo}
        </Text>
        {subtitulo && (
          <Text style={[styles.subtitulo, { color: cores.textoApoio }]} numberOfLines={2}>
            {subtitulo}
          </Text>
        )}
        {selo && <Badge texto={selo.texto} tom={selo.tom} />}
      </View>

      {detalhe && <Text style={[styles.detalhe, { color: cores.texto }]}>{detalhe}</Text>}
      {aoPressionar && <Ionicons name="chevron-forward" size={20} color={cores.textoApoio} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  textos: {
    flex: 1,
    gap: 4,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitulo: {
    fontSize: 13,
  },
  detalhe: {
    fontSize: 15,
    fontWeight: '600',
  },
});