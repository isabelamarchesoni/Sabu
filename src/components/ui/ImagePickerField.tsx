import { useContext } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';
import Button from './Button';

type Props = {
  previa: string | null;
  aoEscolher: () => void;
  aoRemover: () => void;
  removendo?: boolean;
  desabilitado?: boolean;
};

export default function ImagePickerField({ previa, aoEscolher, aoRemover, removendo = false, desabilitado = false }: Props) {
  const { cores } = useContext(TemaContext);
  const bloqueado = desabilitado || removendo;

  if (!previa) {
    return (
      <Pressable
        onPress={aoEscolher}
        disabled={bloqueado}
        accessibilityRole="button"
        accessibilityLabel="Adicionar foto"
        style={function ({ pressed }) {
          return [estilos.vazio, { backgroundColor: cores.fundoImagem, borderColor: cores.bordaForte, opacity: pressed ? 0.8 : bloqueado ? 0.6 : 1 }];
        }}
      >
        <View style={[estilos.circulo, { backgroundColor: cores.destaqueSuave }]}>
          <Ionicons name="camera-outline" size={24} color={cores.botao} />
        </View>
        <Text style={[estilos.titulo, { color: cores.texto }]}>Adicionar foto</Text>
        <Text style={[estilos.ajuda, { color: cores.textoApoio }]}>Toque para escolher da galeria</Text>
      </Pressable>
    );
  }

  return (
    <View style={estilos.bloco}>
      <Pressable onPress={aoEscolher} disabled={bloqueado} accessibilityRole="button" accessibilityLabel="Trocar foto">
        <Image source={{ uri: previa }} style={[estilos.foto, { backgroundColor: cores.fundoImagem, borderColor: cores.borda }]} resizeMode="cover" />
        <View style={[estilos.selo, { backgroundColor: cores.cartao }]}>
          <Ionicons name="camera-outline" size={16} color={cores.texto} />
          <Text style={[estilos.textoSelo, { color: cores.texto }]}>Trocar foto</Text>
        </View>
      </Pressable>
      <Button titulo="Excluir foto" variante="textoPerigo" icone="trash-outline" carregando={removendo} desabilitado={desabilitado} aoPressionar={aoRemover} />
    </View>
  );
}

const estilos = StyleSheet.create({
  vazio: {
    height: 168,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  circulo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  titulo: {
    fontSize: 15,
    fontWeight: '600',
  },
  ajuda: {
    fontSize: 13,
  },
  bloco: {
    gap: 4,
  },
  foto: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    borderWidth: 1,
  },
  selo: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
  },
  textoSelo: {
    fontSize: 13,
    fontWeight: '600',
  },
});
