import { useContext } from 'react';
import { View, Text, Switch, Pressable, StyleSheet } from 'react-native';
import { TemaContext } from '../../theme/TemaContext';

type Props = {
  rotulo: string;
  descricao?: string;
  valor: boolean;
  aoMudar: (valor: boolean) => void;
};

export default function Toggle({ rotulo, descricao, valor, aoMudar }: Props) {
  const { cores } = useContext(TemaContext);

  return (
    <Pressable
      onPress={function () {
        aoMudar(!valor);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: valor }}
      accessibilityLabel={rotulo}
      style={[styles.linha, { backgroundColor: cores.campo, borderColor: valor ? cores.botao : cores.bordaForte }]}
    >
      <View style={styles.textos}>
        <Text style={[styles.rotulo, { color: cores.texto }]}>{rotulo}</Text>
        {descricao && <Text style={[styles.descricao, { color: cores.textoApoio }]}>{descricao}</Text>}
      </View>
      <Switch
        value={valor}
        onValueChange={aoMudar}
        trackColor={{ false: cores.bordaForte, true: cores.botao }}
        ios_backgroundColor={cores.bordaForte}
        thumbColor="#FFFFFF"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 12,
  },
  textos: {
    flex: 1,
  },
  rotulo: {
    fontSize: 16,
    fontWeight: '500',
  },
  descricao: {
    fontSize: 13,
    marginTop: 2,
  },
});
