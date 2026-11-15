import { useContext } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';
import VitoriaRegia from '../VitoriaRegia';
import Button from './Button';

type Props = {
  tipo: 'carregando' | 'erro' | 'vazio';
  mensagem?: string;
  aoTentarNovamente?: () => void;
};

export default function ScreenState({ tipo, mensagem, aoTentarNovamente }: Props) {
  const { cores } = useContext(TemaContext);

  const mensagensPadrao = {
    carregando: 'Carregando…',
    vazio: 'Nada por aqui ainda.',
    erro: 'Algo deu errado.',
  };

  return (
    <View style={styles.container}>
      {tipo === 'carregando' && <ActivityIndicator size="large" color={cores.botao} />}
      {tipo === 'vazio' && <VitoriaRegia tamanho={72} cores={cores} mostrarFlor={false} sombra={false} />}
      {tipo === 'erro' && <Ionicons name="cloud-offline-outline" size={44} color={cores.textoApoio} />}

      <Text style={[styles.mensagem, { color: cores.textoApoio }]}>{mensagem ?? mensagensPadrao[tipo]}</Text>

      {tipo === 'erro' && aoTentarNovamente && <Button titulo="Tentar de novo" variante="secundario" aoPressionar={aoTentarNovamente} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  mensagem: {
    fontSize: 15,
    textAlign: 'center',
  },
});