import { useContext } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';
import { PERGUNTAS } from '../../services/quiz';
import Screen from '../../components/ui/Screen';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';

export default function IntroducaoQuiz() {
  const { cores } = useContext(TemaContext);

  const destaques = [
    { icone: 'help-circle-outline' as const, texto: `${PERGUNTAS.length} perguntas rápidas` },
    { icone: 'time-outline' as const, texto: 'Leva cerca de 1 minuto' },
    { icone: 'lock-open-outline' as const, texto: 'Não precisa de cadastro' },
  ];

  return (
    <Screen rolavel>
      <Header titulo="Quiz do Bú" voltar />

      <View style={estilos.centro}>
        <Image source={require('../../../assets/bu/bu-cabeca.png')} style={estilos.bu} accessibilityLabel="Bú, o sapinho da Sabu" />
        <Text style={[estilos.titulo, { color: cores.texto }]}>Qual sabonete combina com você?</Text>
        <Text style={[estilos.texto, { color: cores.textoApoio }]}>Conte um pouco sobre a sua pele e o que você gosta. O Bú escolhe o sabonete ideal para você.</Text>
      </View>

      <View style={[estilos.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
        {destaques.map(function (item) {
          return (
            <View key={item.texto} style={estilos.destaque}>
              <Ionicons name={item.icone} size={20} color={cores.botao} />
              <Text style={[estilos.textoDestaque, { color: cores.texto }]}>{item.texto}</Text>
            </View>
          );
        })}
      </View>

      <View style={estilos.acoes}>
        <Button
          titulo="Começar"
          icone="arrow-forward"
          aoPressionar={function () {
            router.push('/quiz/perguntas');
          }}
        />
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  centro: {
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  bu: {
    width: 150,
    height: 163,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  texto: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  cartao: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    marginTop: 24,
  },
  destaque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textoDestaque: {
    fontSize: 15,
  },
  acoes: {
    marginTop: 28,
    marginBottom: 12,
  },
});
