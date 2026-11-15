import { View, Animated, StyleSheet } from 'react-native';
import { Tema } from '../theme/cores';

type Props = {
  tamanho: number;
  cores: Tema;
  corFundo?: string;
  mostrarFlor?: boolean;
  escalaFlor?: Animated.Value;
  giro?: number;
  sombra?: boolean;
};

const GIRO_PADRAO = 75;
const PROPORCAO_BORDA = 0.05;
const PROPORCAO_FENDA = 0.3;
const PROPORCAO_VEIA = 0.012;
const PROPORCAO_FLOR = 0.46;
const PROPORCAO_LARGURA_PETALA = 0.24;
const PROPORCAO_ALTURA_PETALA = 0.5;
const PROPORCAO_MIOLO = 0.26;
const SOMBRA_DESLOCAMENTO_X = 0.05;
const SOMBRA_DESLOCAMENTO_Y = 0.08;
const ANGULOS_VEIAS = [30, 90, 150];
const ANGULOS_PETALAS = [0, 45, 90, 135, 180, 225, 270, 315];

export default function VitoriaRegia({ tamanho, cores, corFundo, mostrarFlor = true, escalaFlor, giro = GIRO_PADRAO, sombra = true }: Props) {
  const borda = tamanho * PROPORCAO_BORDA;
  const interno = tamanho - borda * 2;
  const fenda = tamanho * PROPORCAO_FENDA;
  const veia = Math.max(1, tamanho * PROPORCAO_VEIA);
  const flor = tamanho * PROPORCAO_FLOR;
  const larguraPetala = flor * PROPORCAO_LARGURA_PETALA;
  const alturaPetala = flor * PROPORCAO_ALTURA_PETALA;
  const miolo = flor * PROPORCAO_MIOLO;
  const corDaFenda = corFundo ?? cores.fundo;

  const formaCircular = {
    width: tamanho,
    height: tamanho,
    borderRadius: tamanho / 2,
    transform: [{ rotate: giro + 'deg' }],
  };

  const estiloFenda = {
    left: (tamanho - fenda) / 2,
    top: -fenda / 2,
    width: fenda,
    height: fenda,
    backgroundColor: corDaFenda,
    transform: [{ rotate: '45deg' }],
  };

  return (
    <View style={{ width: tamanho, height: tamanho }}>
      {sombra && (
        <View
          style={[
            styles.absoluto,
            styles.recorte,
            formaCircular,
            { left: tamanho * SOMBRA_DESLOCAMENTO_X, top: tamanho * SOMBRA_DESLOCAMENTO_Y, backgroundColor: cores.sombraFolha },
          ]}
        >
          <View style={[styles.absoluto, estiloFenda]} />
        </View>
      )}

      <View style={[styles.absoluto, styles.recorte, formaCircular, { backgroundColor: cores.folhaBorda }]}>
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

        <View style={[styles.absoluto, estiloFenda]} />
      </View>

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
  absoluto: {
    position: 'absolute',
  },
  recorte: {
    overflow: 'hidden',
  },
});