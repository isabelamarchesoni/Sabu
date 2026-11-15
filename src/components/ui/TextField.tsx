import { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, type KeyboardTypeOptions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';

type Props = {
  rotulo: string;
  valor: string;
  aoMudar: (texto: string) => void;
  placeholder?: string;
  erro?: string;
  ajuda?: string;
  senha?: boolean;
  teclado?: KeyboardTypeOptions;
  multilinha?: boolean;
  maiusculas?: 'none' | 'sentences' | 'words' | 'characters';
  desabilitado?: boolean;
  sufixo?: string;
  aoEnviar?: () => void;
};

export default function TextField({ rotulo, valor, aoMudar, placeholder, erro, ajuda, senha = false, teclado, multilinha = false, maiusculas, desabilitado = false, sufixo, aoEnviar }: Props) {
  const { cores } = useContext(TemaContext);
  const [senhaVisivel, setSenhaVisivel] = useState(false);

  return (
    <View style={styles.grupo}>
      <Text style={[styles.rotulo, { color: cores.texto }]}>{rotulo}</Text>

      <View style={[styles.caixa, multilinha && styles.caixaMultilinha, { backgroundColor: desabilitado ? cores.superficie : cores.campo, borderColor: erro ? cores.erro : cores.bordaForte }]}>
        <TextInput
          style={[styles.entrada, multilinha && styles.entradaMultilinha, { color: cores.texto }]}
          value={valor}
          onChangeText={aoMudar}
          placeholder={placeholder}
          placeholderTextColor={cores.placeholder}
          secureTextEntry={senha && !senhaVisivel}
          keyboardType={teclado}
          multiline={multilinha}
          autoCapitalize={maiusculas ?? (senha ? 'none' : 'sentences')}
          editable={!desabilitado}
          onSubmitEditing={aoEnviar}
          textAlignVertical={multilinha ? 'top' : 'center'}
          accessibilityLabel={rotulo}
        />

        {sufixo && <Text style={[styles.sufixo, { color: cores.textoApoio }]}>{sufixo}</Text>}

        {senha && (
          <TouchableOpacity
            style={styles.botaoOlho}
            onPress={function () {
              setSenhaVisivel(!senhaVisivel);
            }}
            accessibilityLabel={senhaVisivel ? 'Esconder senha' : 'Mostrar senha'}
          >
            <Ionicons name={senhaVisivel ? 'eye-off-outline' : 'eye-outline'} size={22} color={cores.textoApoio} />
          </TouchableOpacity>
        )}
      </View>

      {erro ? <Text style={[styles.mensagem, { color: cores.erro }]}>{erro}</Text> : ajuda ? <Text style={[styles.mensagem, { color: cores.textoApoio }]}>{ajuda}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: {
    marginBottom: 16,
  },
  rotulo: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  caixa: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  caixaMultilinha: {
    minHeight: 120,
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  entrada: {
    flex: 1,
    minHeight: 50,
    fontSize: 16,
    paddingRight: 16,
  },
  entradaMultilinha: {
    minHeight: 100,
  },
  sufixo: {
    fontSize: 15,
    paddingRight: 16,
  },
  botaoOlho: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mensagem: {
    fontSize: 13,
    marginTop: 6,
  },
});