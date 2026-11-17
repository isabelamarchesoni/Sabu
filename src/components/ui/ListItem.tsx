import { useContext } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';
import Badge, { type TomBadge } from './Badge';

type Selo = { texto: string; tom?: TomBadge };

type Props = {
  titulo: string;
  subtitulo?: string;
  detalhe?: string;
  imagem?: string | null;
  selo?: Selo;
  selosExtras?: Selo[];
  aoPressionar?: () => void;
};

export default function ListItem({ titulo, subtitulo, detalhe, imagem, selo, selosExtras, aoPressionar }: Props) {
  const { cores } = useContext(TemaContext);
  const selos: Selo[] = [...(selo ? [selo] : []), ...(selosExtras ?? [])];

  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: cores.cartao, borderColor: cores.borda, boxShadow: `0px 2px 10px ${cores.sombraCartao}` }]}
      onPress={aoPressionar}
      disabled={!aoPressionar}
      accessibilityRole="button"
    >
      {imagem ? (
        <Image
          source={{ uri: imagem }}
          style={[styles.imagem, { backgroundColor: cores.borda }]}
          resizeMode="cover"
          accessible={false}
        />
      ) : null}

      <View style={styles.textos}>
        <Text style={[styles.titulo, { color: cores.texto }]} numberOfLines={1}>
          {titulo}
        </Text>
        {subtitulo ? (
          <Text style={[styles.subtitulo, { color: cores.textoApoio }]} numberOfLines={2}>
            {subtitulo}
          </Text>
        ) : null}
        {selos.length > 0 && (
          <View style={styles.selos}>
            {selos.map(function (item) {
              return <Badge key={item.texto} texto={item.texto} tom={item.tom} />;
            })}
          </View>
        )}
      </View>

      {detalhe ? <Text style={[styles.detalhe, { color: cores.texto }]}>{detalhe}</Text> : null}
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
  imagem: {
    width: 56,
    height: 56,
    borderRadius: 10,
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
  selos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  detalhe: {
    fontSize: 15,
    fontWeight: '600',
  },
});