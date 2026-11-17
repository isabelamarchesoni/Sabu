import { useContext, useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { TemaContext } from '../theme/TemaContext';

const LARGURA_BU = 170;
const ALTURA_BU = Math.round((LARGURA_BU * 435) / 400);
const TAMANHO_CIRCULO = 140;
const DRIVER_NATIVO = Platform.OS !== 'web';

export default function Splash() {
  const { cores } = useContext(TemaContext);

  const crescimento = useRef(new Animated.Value(0)).current;
  const piscada = useRef(new Animated.Value(0)).current;
  const expansao = useRef(new Animated.Value(0)).current;
  const marca = useRef(new Animated.Value(0)).current;

  useEffect(function () {
    Animated.sequence([
      Animated.timing(crescimento, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: DRIVER_NATIVO,
      }),
      Animated.delay(250),
      Animated.timing(piscada, {
        toValue: 1,
        duration: 70,
        useNativeDriver: DRIVER_NATIVO,
      }),
      Animated.delay(260),
      Animated.timing(piscada, {
        toValue: 0,
        duration: 90,
        useNativeDriver: DRIVER_NATIVO,
      }),
      Animated.delay(250),
      Animated.timing(expansao, {
        toValue: 1,
        duration: 700,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: DRIVER_NATIVO,
      }),
      Animated.timing(marca, {
        toValue: 1,
        duration: 500,
        useNativeDriver: DRIVER_NATIVO,
      }),
      Animated.delay(900),
    ]).start(function () {
      router.replace('/vitrine');
    });
  }, []);

  const escalaBu = crescimento.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] });
  const giroBu = crescimento.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '0deg'] });
  const olhoAberto = piscada.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const escalaCirculo = expansao.interpolate({ inputRange: [0, 1], outputRange: [0.01, 14] });
  const subidaMarca = marca.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <View style={[styles.tela, { backgroundColor: cores.fundo }]} accessibilityLabel="Sabu, abrindo o aplicativo. O sapinho Bú pisca para você.">
      <Animated.View style={[styles.bu, { transform: [{ scale: escalaBu }, { rotate: giroBu }] }]}>
        <Animated.Image source={require('../../assets/bu/bu-cabeca.png')} style={[styles.imagemBu, { opacity: olhoAberto }]} />
        <Animated.Image source={require('../../assets/bu/bu-piscando.png')} style={[styles.imagemBu, styles.sobreposta, { opacity: piscada }]} />
      </Animated.View>

      <View style={styles.camadaCentral} pointerEvents="none">
        <Animated.View
          style={[
            styles.circulo,
            { backgroundColor: cores.splashFundo, transform: [{ scale: escalaCirculo }] },
          ]}
        />
      </View>

      <View style={styles.camadaCentral} pointerEvents="none">
        <Animated.View style={{ opacity: marca, transform: [{ translateY: subidaMarca }], alignItems: 'center' }}>
          <Text style={[styles.marca, { color: cores.splashTexto }]}>Sabu</Text>
          <Text style={[styles.slogan, { color: cores.splashTexto }]}>feito pra cuidar de tu</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  camadaCentral: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bu: {
    width: LARGURA_BU,
    height: ALTURA_BU,
  },
  imagemBu: {
    width: LARGURA_BU,
    height: ALTURA_BU,
  },
  sobreposta: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  circulo: {
    width: TAMANHO_CIRCULO,
    height: TAMANHO_CIRCULO,
    borderRadius: TAMANHO_CIRCULO / 2,
  },
  marca: {
    fontFamily: 'Gaegu_700Bold',
    fontSize: 64,
    lineHeight: 70,
  },
  slogan: {
    fontFamily: 'Gaegu_400Regular',
    fontSize: 24,
  },
});