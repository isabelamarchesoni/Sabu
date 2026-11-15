import { useContext, type ReactNode } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TemaContext } from '../../theme/TemaContext';

type Props = {
  children: ReactNode;
  rolavel?: boolean;
  rodape?: ReactNode;
};

export default function Screen({ children, rolavel = false, rodape }: Props) {
  const { cores } = useContext(TemaContext);
  const espacos = useSafeAreaInsets();
  const espacoInferior = rodape ? 16 : espacos.bottom + 16;

  return (
    <KeyboardAvoidingView style={[styles.tela, { backgroundColor: cores.fundo, paddingTop: espacos.top + 8 }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {rolavel ? (
        <ScrollView contentContainerStyle={[styles.conteudoRolavel, { paddingBottom: espacoInferior }]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={styles.conteudo}>{children}</View>
      )}

      {rodape && <View style={[styles.rodape, { paddingBottom: espacos.bottom + 12, backgroundColor: cores.fundo, borderTopColor: cores.borda }]}>{rodape}</View>}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
  },
  conteudo: {
    flex: 1,
    paddingHorizontal: 20,
  },
  conteudoRolavel: {
    paddingHorizontal: 20,
  },
  rodape: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
});