import { useContext, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../theme/TemaContext';
import { entrar, usuarioAtual } from '../services/autenticacao';
import { mensagemDeErro } from '../services/api';
import VitoriaRegia from '../components/VitoriaRegia';

export default function Login() {
  const { cores, modoEscuro, alternarTema } = useContext(TemaContext);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const opacidadeFolhas = modoEscuro ? 0.85 : 1;

  useEffect(function () {
    verificarSessao();
  }, []);

  async function verificarSessao() {
    const usuario = await usuarioAtual();
    if (usuario) {
      router.replace('/inicio');
    }
  }

  async function fazerLogin() {
    if (email.trim() === '' || senha === '') {
      setErro('Preencha o e-mail e a senha.');
      return;
    }
    setErro('');
    setCarregando(true);
    try {
      await entrar(email.trim(), senha);
      router.replace('/inicio');
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível entrar. Tente novamente.'));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.tela, { backgroundColor: cores.fundo }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.decoracao, { opacity: opacidadeFolhas }]}>
        <View style={styles.folhaTopo}>
          <VitoriaRegia tamanho={190} cores={cores} mostrarFlor={false} giro={75} />
        </View>
        <View style={styles.folhaGrande}>
          <VitoriaRegia tamanho={300} cores={cores} mostrarFlor={false} giro={75} />
        </View>
        <View style={styles.folhaPequena}>
          <VitoriaRegia tamanho={140} cores={cores} mostrarFlor={false} giro={75} />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.botaoTema, { backgroundColor: cores.superficie, borderColor: cores.borda }]}
        onPress={alternarTema}
        accessibilityLabel={modoEscuro ? 'Ativar modo claro' : 'Ativar modo escuro'}
      >
        <Ionicons name={modoEscuro ? 'sunny-outline' : 'moon-outline'} size={22} color={cores.texto} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <View style={styles.cabecalho}>
          <View style={[styles.logo, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <VitoriaRegia tamanho={54} cores={cores} corFundo={cores.superficie} mostrarFlor={false} sombra={false} />
          </View>
          <Text style={[styles.titulo, { color: cores.texto }]}>Bem-vinda de volta</Text>
          <Text style={[styles.subtitulo, { color: cores.textoApoio }]}>Entre para cuidar do seu estoque.</Text>
        </View>

        <Text style={[styles.rotulo, { color: cores.texto }]}>E-mail</Text>
        <TextInput
          style={[styles.campo, { backgroundColor: cores.campo, borderColor: cores.borda, color: cores.texto }]}
          value={email}
          onChangeText={setEmail}
          placeholder="maria@email.com"
          placeholderTextColor={cores.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!carregando}
        />

        <Text style={[styles.rotulo, { color: cores.texto }]}>Senha</Text>
        <View style={styles.linhaSenha}>
          <TextInput
            style={[styles.campo, styles.campoSenha, { backgroundColor: cores.campo, borderColor: cores.borda, color: cores.texto }]}
            value={senha}
            onChangeText={setSenha}
            placeholder="Sua senha"
            placeholderTextColor={cores.placeholder}
            secureTextEntry={!senhaVisivel}
            autoCapitalize="none"
            onSubmitEditing={fazerLogin}
            editable={!carregando}
          />
          <TouchableOpacity
            style={styles.botaoOlho}
            onPress={function () {
              setSenhaVisivel(!senhaVisivel);
            }}
            accessibilityLabel={senhaVisivel ? 'Esconder senha' : 'Mostrar senha'}
          >
            <Ionicons name={senhaVisivel ? 'eye-off-outline' : 'eye-outline'} size={22} color={cores.textoApoio} />
          </TouchableOpacity>
        </View>

        {erro !== '' && <Text style={[styles.erro, { color: cores.erro }]}>{erro}</Text>}

        <TouchableOpacity
          style={[styles.botao, { backgroundColor: cores.botao, opacity: carregando ? 0.7 : 1 }]}
          onPress={fazerLogin}
          disabled={carregando}
          accessibilityRole="button"
          accessibilityState={{ busy: carregando }}
        >
          {carregando ? <ActivityIndicator color={cores.botaoTexto} /> : <Text style={[styles.textoBotao, { color: cores.botaoTexto }]}>Entrar</Text>}
        </TouchableOpacity>

        <Text style={[styles.rodape, { color: cores.textoApoio }]}>
          Só quer olhar os sabonetes?{' '}
          <Link href="/vitrine" style={[styles.link, { color: cores.link }]}>
            Ver vitrine
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    overflow: 'hidden',
  },
  decoracao: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  folhaTopo: {
    position: 'absolute',
    top: -60,
    left: -70,
  },
  folhaGrande: {
    position: 'absolute',
    right: -90,
    bottom: -70,
  },
  folhaPequena: {
    position: 'absolute',
    left: -50,
    bottom: 60,
  },
  botaoTema: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conteudo: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 96,
    paddingBottom: 180,
  },
  cabecalho: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '600',
  },
  subtitulo: {
    fontSize: 15,
    marginTop: 6,
  },
  rotulo: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 16,
  },
  campo: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  linhaSenha: {
    justifyContent: 'center',
  },
  campoSenha: {
    paddingRight: 52,
  },
  botaoOlho: {
    position: 'absolute',
    right: 2,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  erro: {
    fontSize: 14,
    marginTop: 12,
  },
  botao: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  textoBotao: {
    fontSize: 16,
    fontWeight: '600',
  },
  rodape: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
  link: {
    fontWeight: '600',
  },
});