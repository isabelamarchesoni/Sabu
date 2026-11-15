import { useContext, type ComponentProps } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';

type Variante = 'primario' | 'secundario' | 'texto' | 'perigo' | 'textoPerigo';

type Props = {
  titulo: string;
  aoPressionar: () => void;
  variante?: Variante;
  carregando?: boolean;
  desabilitado?: boolean;
  icone?: ComponentProps<typeof Ionicons>['name'];
};

export default function Button({ titulo, aoPressionar, variante = 'primario', carregando = false, desabilitado = false, icone }: Props) {
  const { cores } = useContext(TemaContext);
  const inativo = desabilitado || carregando;

  const fundos: Record<Variante, string> = {
    primario: cores.botao,
    secundario: 'transparent',
    texto: 'transparent',
    perigo: cores.erro,
    textoPerigo: 'transparent',
  };

  const textos: Record<Variante, string> = {
    primario: cores.botaoTexto,
    secundario: cores.texto,
    texto: cores.link,
    perigo: cores.botaoTexto,
    textoPerigo: cores.erro,
  };

  return (
    <TouchableOpacity
      style={[
        styles.botao,
        { backgroundColor: fundos[variante], borderColor: variante === 'secundario' ? cores.bordaForte : 'transparent', opacity: inativo ? 0.6 : 1 },
        (variante === 'texto' || variante === 'textoPerigo') && styles.botaoSoTexto,
      ]}
      onPress={aoPressionar}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo, busy: carregando }}
    >
      {carregando ? (
        <ActivityIndicator color={textos[variante]} />
      ) : (
        <>
          {icone && <Ionicons name={icone} size={20} color={textos[variante]} />}
          <Text style={[styles.texto, { color: textos[variante] }]}>{titulo}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botaoSoTexto: {
    height: 44,
  },
  texto: {
    fontSize: 16,
    fontWeight: '600',
  },
});