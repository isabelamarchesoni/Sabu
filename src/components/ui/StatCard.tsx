import { useContext, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';

type Props = { rotulo: string; valor: number | null; icone: ComponentProps<typeof Ionicons>['name']; tom?: 'alerta' | 'erro'; aoPressionar?: () => void };

export default function StatCard({ rotulo, valor, icone, tom = 'alerta', aoPressionar }: Props) {
  const { cores } = useContext(TemaContext);
  const temAviso = valor !== null && valor > 0;
  const corAviso = tom === 'erro' ? cores.erro : cores.alerta;
  const corIcone = temAviso ? corAviso : cores.textoApoio;

  function estiloCartao({ pressed }: { pressed: boolean }) {
    return [
      estilos.cartao,
      {
        backgroundColor: cores.cartao,
        borderColor: cores.borda,
        boxShadow: `0px 4px 12px ${cores.sombraCartao}`,
        opacity: pressed ? 0.85 : 1,
      },
    ];
  }

  return (
    <Pressable onPress={aoPressionar} disabled={!aoPressionar} accessibilityRole="button" accessibilityLabel={`${rotulo}: ${valor === null ? 'carregando' : valor}`} style={estiloCartao}>
      <View style={[estilos.icone, { backgroundColor: cores.destaqueSuave }]}>
        <Ionicons name={icone} size={18} color={corIcone} />
      </View>
      <Text style={[estilos.valor, { color: temAviso ? corAviso : cores.texto }]}>{valor === null ? '–' : valor}</Text>
      <Text style={[estilos.rotulo, { color: cores.textoApoio }]} numberOfLines={2}>{rotulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    flex: 1,
    minHeight: 128,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 6,
  },
  icone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valor: {
    fontSize: 28,
    fontWeight: '700',
  },
  rotulo: {
    fontSize: 12,
    lineHeight: 16,
  },
});