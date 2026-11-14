import { useContext, useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { TemaContext } from '../theme/TemaContext';
import VitoriaRegia from '../components/VitoriaRegia';

const TAMANHO_FOLHA = 140;
const DRIVER_NATIVO = Platform.OS !== 'web';

export default function Splash() {
  const { cores } = useContext(TemaContext);

  const crescimento = useRef(new Animated.Value(0)).current;
  const aberturaFlor = useRef(new Animated.Value(0)).current;
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
      Animated.timing(aberturaFlor, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
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
      router.replace('/login');
    });
  }, []);

  const escalaFolha = crescimento.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] });
  const giroFolha = crescimento.interpolate({ inputRange: [0, 1], outputRange: ['-40deg', '0deg'] });
  const escalaCirculo = expansao.interpolate({ inputRange: [0, 1], outputRange: [0.01, 14] });
  const subidaMarca = marca.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <View style={[styles.tela, { backgroundColor: cores.fundo }]} accessibilityLabel="Sabu, abrindo o aplicativo">
      <Animated.View style={{ transform: [{ scale: escalaFolha }, { rotate: giroFolha }] }}>
        <VitoriaRegia tamanho={TAMANHO_FOLHA} cores={cores} escalaFlor={aberturaFlor} />
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
          <Text style={[styles.slogan, { color: cores.splashTexto }]}>cuidado em cada sabonete</Text>
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
  circulo: {
    width: TAMANHO_FOLHA,
    height: TAMANHO_FOLHA,
    borderRadius: TAMANHO_FOLHA / 2,
  },
  marca: {
    fontSize: 44,
    fontWeight: 'bold',
  },
  slogan: {
    fontSize: 15,
    marginTop: 8,
  },
});