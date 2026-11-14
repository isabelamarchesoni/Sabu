import { View, Animated, StyleSheet } from 'react-native';
import { Tema } from '../theme/cores';

type Props = {
  tamanho: number;
  cores: Tema;
  corFundo?: string;
  mostrarFlor?: boolean;
  escalaFlor?: Animated.Value;
};

const ANGULOS_VEIAS = [30, 90, 150];
const ANGULOS_PETALAS = [0, 45, 90, 135, 180, 225, 270, 315];

export default function VitoriaRegia({ tamanho, cores, corFundo, mostrarFlor = true, escalaFlor }: Props) {
  const borda = tamanho * 0.05;
  const interno = tamanho - borda * 2;
  const fenda = tamanho * 0.3;
  const veia = Math.max(1, tamanho * 0.012);
  const flor = tamanho * 0.46;
  const larguraPetala = flor * 0.24;
  const alturaPetala = flor * 0.5;
  const miolo = flor * 0.26;

  return (
    <View
      style={[
        styles.folhaExterna,
        { width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: cores.folhaBorda },
      ]}
    >
      <View
        style={[
          styles.absoluto,
          { left: borda, top: borda, width: interno, height: interno, borderRadius: interno / 2, backgroundColor: cores.folha },
        ]}
      />

      {ANGULOS_VEIAS.map(function (angulo) {
        return (
          <View
            key={angulo}
            style={[
              styles.absoluto,
              {
                left: borda + interno * 0.1,
                top: (tamanho - veia) / 2,
                width: interno * 0.8,
                height: veia,
                backgroundColor: cores.folhaVeia,
                transform: [{ rotate: angulo + 'deg' }],
              },
            ]}
          />
        );
      })}

      <View
        style={[
          styles.absoluto,
          {
            left: (tamanho - fenda) / 2,
            top: -fenda / 2,
            width: fenda,
            height: fenda,
            backgroundColor: corFundo ?? cores.fundo,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />

      {mostrarFlor && (
        <Animated.View
          style={[
            styles.absoluto,
            {
              left: (tamanho - flor) / 2,
              top: (tamanho - flor) / 2,
              width: flor,
              height: flor,
              transform: escalaFlor ? [{ scale: escalaFlor }] : [],
            },
          ]}
        >
          {ANGULOS_PETALAS.map(function (angulo) {
            return (
              <View
                key={angulo}
                style={[
                  styles.absoluto,
                  {
                    left: (flor - larguraPetala) / 2,
                    top: (flor - alturaPetala) / 2,
                    width: larguraPetala,
                    height: alturaPetala,
                    borderRadius: larguraPetala / 2,
                    backgroundColor: cores.petala,
                    transform: [{ rotate: angulo + 'deg' }, { translateY: -alturaPetala * 0.45 }],
                  },
                ]}
              />
            );
          })}
          <View
            style={[
              styles.absoluto,
              {
                left: (flor - miolo) / 2,
                top: (flor - miolo) / 2,
                width: miolo,
                height: miolo,
                borderRadius: miolo / 2,
                backgroundColor: cores.miolo,
              },
            ]}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  folhaExterna: {
    overflow: 'hidden',
  },
  absoluto: {
    position: 'absolute',
  },
});