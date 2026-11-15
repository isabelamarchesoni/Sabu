import { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TemaContext } from '../../theme/TemaContext';

export type TomBadge = 'neutro' | 'sucesso' | 'alerta' | 'erro' | 'destaque';

type Props = {
  texto: string;
  tom?: TomBadge;
};

export default function Badge({ texto, tom = 'neutro' }: Props) {
  const { cores } = useContext(TemaContext);

  const fundos: Record<TomBadge, string> = {
    neutro: cores.superficie,
    sucesso: cores.destaqueSuave,
    alerta: cores.superficie,
    erro: cores.superficie,
    destaque: cores.botao,
  };

  const textos: Record<TomBadge, string> = {
    neutro: cores.textoApoio,
    sucesso: cores.sucesso,
    alerta: cores.alerta,
    erro: cores.erro,
    destaque: cores.botaoTexto,
  };

  return (
    <View style={[styles.selo, { backgroundColor: fundos[tom] }]}>
      <Text style={[styles.texto, { color: textos[tom] }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  selo: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  texto: {
    fontSize: 12,
    fontWeight: '600',
  },
});