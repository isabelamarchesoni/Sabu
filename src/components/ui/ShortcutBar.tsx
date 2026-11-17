import { useContext, type ComponentProps } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';

export type Atalho = {
  rotulo: string;
  rota: string;
  icone: ComponentProps<typeof Ionicons>['name'];
};

type Props = {
  atalhos: Atalho[];
};

export default function ShortcutBar({ atalhos }: Props) {
  const { cores } = useContext(TemaContext);

  return (
    <View style={estilos.linha}>
      {atalhos.map(function (atalho) {
        return (
          <TouchableOpacity
            key={atalho.rota}
            style={[estilos.atalho, { backgroundColor: cores.botao }]}
            onPress={function () {
              router.push(atalho.rota as Href);
            }}
            accessibilityRole="button"
          >
            <Ionicons name={atalho.icone} size={18} color={cores.botaoTexto} />
            <Text style={[estilos.rotulo, { color: cores.botaoTexto }]} numberOfLines={1}>
              {atalho.rotulo}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  atalho: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  rotulo: {
    fontSize: 14,
    fontWeight: '600',
  },
});
