import { useContext } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';

type Props = {
  aoPressionar: () => void;
};

export default function QuizBanner({ aoPressionar }: Props) {
  const { cores } = useContext(TemaContext);

  return (
    <TouchableOpacity
      style={[estilos.cartao, { backgroundColor: cores.destaqueSuave, borderColor: cores.borda }]}
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel="Fazer o quiz do Bú para descobrir o sabonete ideal"
    >
      <Image source={require('../../../assets/bu/bu-cabeca.png')} style={estilos.bu} />
      <View style={estilos.textos}>
        <Text style={[estilos.titulo, { color: cores.texto }]}>Qual sabonete combina com você?</Text>
        <Text style={[estilos.subtitulo, { color: cores.textoApoio }]}>Responda o quiz do Bú e descubra.</Text>
        <View style={[estilos.botao, { backgroundColor: cores.botao }]}>
          <Text style={[estilos.textoBotao, { color: cores.botaoTexto }]}>Fazer o quiz</Text>
          <Ionicons name="arrow-forward" size={16} color={cores.botaoTexto} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  bu: {
    width: 78,
    height: 85,
  },
  textos: {
    flex: 1,
    gap: 4,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitulo: {
    fontSize: 13,
  },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    height: 36,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  textoBotao: {
    fontSize: 14,
    fontWeight: '600',
  },
});
