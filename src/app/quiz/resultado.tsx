import { useContext, useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';
import { buscarProduto, type Produto } from '../../services/catalogo';
import { mensagemDeErro } from '../../services/api';
import { formatarDinheiro, precoAtual, variacoesDisponiveis } from '../../utils/formatar';
import { linkWhatsapp, whatsappDisponivel } from '../../utils/whatsapp';
import { mensagemQuiz, type ResumoQuiz } from '../../utils/mensagens';
import Screen from '../../components/ui/Screen';
import Header from '../../components/ui/Header';
import SectionTitle from '../../components/ui/SectionTitle';
import Button from '../../components/ui/Button';
import Notice from '../../components/ui/Notice';
import ScreenState from '../../components/ui/ScreenState';

function lerResumo(texto: string | undefined): ResumoQuiz {
  if (!texto) {
    return [];
  }
  try {
    const dados = JSON.parse(texto);
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

export default function ResultadoQuiz() {
  const { cores } = useContext(TemaContext);
  const parametros = useLocalSearchParams<{ produto: string; variacao?: string; motivo?: string; aviso?: string; resumo?: string }>();
  const resumo = lerResumo(parametros.resumo);

  const [produto, setProduto] = useState<Produto | null>(null);
  const [variacaoId, setVariacaoId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroWhatsapp, setErroWhatsapp] = useState('');

  useEffect(
    function () {
      carregar();
    },
    [parametros.produto]
  );

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const dados = await buscarProduto(Number(parametros.produto));
      const disponiveis = variacoesDisponiveis(dados);
      const sugerida = disponiveis.find(function (variacao) {
        return variacao.id === Number(parametros.variacao);
      });
      const primeira = disponiveis.find(function (variacao) {
        return variacao.quantidade_estoque > 0;
      });
      setProduto(dados);
      setVariacaoId(sugerida ? sugerida.id : primeira ? primeira.id : null);
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível carregar o sabonete recomendado.'));
    } finally {
      setCarregando(false);
    }
  }

  async function abrirWhatsapp() {
    if (!produto) {
      return;
    }
    setErroWhatsapp('');
    const escolhida = variacoesDisponiveis(produto).find(function (variacao) {
      return variacao.id === variacaoId;
    });
    try {
      await Linking.openURL(linkWhatsapp(mensagemQuiz(produto, escolhida, resumo)));
    } catch {
      setErroWhatsapp('Não foi possível abrir o WhatsApp neste aparelho.');
    }
  }

  if (carregando || !produto) {
    return (
      <Screen>
        <Header titulo="O Bú recomenda" voltar />
        <ScreenState tipo={carregando ? 'carregando' : 'erro'} mensagem={carregando ? 'O Bú está escolhendo…' : erro} aoTentarNovamente={carregando ? undefined : carregar} />
      </Screen>
    );
  }

  const variacoes = variacoesDisponiveis(produto);

  return (
    <Screen rolavel>
      <Header titulo="O Bú recomenda" voltar />

      <View style={[estilos.destaque, { backgroundColor: cores.destaqueSuave, borderColor: cores.borda }]}>
        <Image source={require('../../../assets/bu/bu-piscando.png')} style={estilos.bu} accessibilityLabel="Bú piscando" />
        <View style={estilos.textosDestaque}>
          <Text style={[estilos.rotulo, { color: cores.textoApoio }]}>Seu sabonete ideal é</Text>
          <Text style={[estilos.nome, { color: cores.texto }]}>{produto.nome}</Text>
        </View>
      </View>

      {produto.imagem ? <Image source={{ uri: produto.imagem }} style={[estilos.foto, { backgroundColor: cores.fundoImagem }]} resizeMode="cover" accessibilityLabel={produto.nome} /> : null}

      {parametros.motivo ? (
        <View style={estilos.secao}>
          <SectionTitle titulo="Por que esse?" />
          <Text style={[estilos.texto, { color: cores.texto }]}>{parametros.motivo}</Text>
        </View>
      ) : null}

      {produto.descricao ? <Text style={[estilos.texto, estilos.descricao, { color: cores.textoApoio }]}>{produto.descricao}</Text> : null}

      {variacoes.length > 0 ? (
        <View style={estilos.secao}>
          <SectionTitle titulo="Escolha a opção" />
          {variacoes.map(function (variacao) {
            const temEstoque = variacao.quantidade_estoque > 0;
            const selecionada = variacao.id === variacaoId;
            return (
              <Pressable
                key={variacao.id}
                onPress={function () {
                  setVariacaoId(variacao.id);
                }}
                disabled={!temEstoque}
                accessibilityRole="radio"
                accessibilityState={{ selected: selecionada, disabled: !temEstoque }}
                style={[estilos.variacao, { backgroundColor: cores.cartao, borderColor: selecionada ? cores.botao : cores.borda, borderWidth: selecionada ? 2 : 1, opacity: temEstoque ? 1 : 0.6 }]}
              >
                <Ionicons name={selecionada ? 'radio-button-on' : 'radio-button-off'} size={22} color={selecionada ? cores.botao : cores.placeholder} />
                <View style={estilos.textosVariacao}>
                  <Text style={[estilos.nomeVariacao, { color: cores.texto }]}>{variacao.nome}</Text>
                  <Text style={[estilos.peso, { color: cores.textoApoio }]}>{temEstoque ? (variacao.peso_gramas ? `${variacao.peso_gramas} g` : 'Disponível') : 'Esgotado'}</Text>
                </View>
                <Text style={[estilos.preco, { color: cores.texto }]}>{formatarDinheiro(precoAtual(variacao))}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {resumo.length > 0 ? (
        <View style={estilos.secao}>
          <SectionTitle titulo="Suas respostas" />
          <View style={[estilos.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
            {resumo.map(function (item, indice) {
              return (
                <View key={item.pergunta} style={[estilos.linha, indice > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: cores.bordaForte }]}>
                  <Text style={[estilos.pergunta, { color: cores.textoApoio }]}>{item.pergunta}</Text>
                  <Text style={[estilos.resposta, { color: cores.texto }]}>{item.resposta}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={estilos.acoes}>
        {erroWhatsapp ? <Notice mensagem={erroWhatsapp} tom="erro" /> : null}
        {whatsappDisponivel() ? <Button titulo="Pedir pelo WhatsApp" icone="logo-whatsapp" aoPressionar={abrirWhatsapp} /> : null}
        <Button
          titulo="Ver detalhes do sabonete"
          variante="secundario"
          icone="leaf-outline"
          aoPressionar={function () {
            router.push(`/vitrine/${produto.id}` as Href);
          }}
        />
        <Button
          titulo="Refazer o quiz"
          variante="texto"
          icone="refresh"
          aoPressionar={function () {
            router.replace('/quiz/perguntas');
          }}
        />
      </View>

      {parametros.aviso ? <Text style={[estilos.aviso, { color: cores.textoApoio }]}>{parametros.aviso}</Text> : null}
    </Screen>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 16,
  },
  destaque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    marginTop: 4,
  },
  bu: {
    width: 70,
    height: 76,
  },
  textosDestaque: {
    flex: 1,
    gap: 2,
  },
  rotulo: {
    fontSize: 13,
    fontWeight: '600',
  },
  nome: {
    fontSize: 22,
    fontWeight: '700',
  },
  foto: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 20,
    marginTop: 16,
  },
  secao: {
    marginTop: 24,
    gap: 10,
  },
  texto: {
    fontSize: 15,
    lineHeight: 22,
  },
  descricao: {
    marginTop: 16,
  },
  variacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
  },
  textosVariacao: {
    flex: 1,
  },
  nomeVariacao: {
    fontSize: 16,
    fontWeight: '600',
  },
  peso: {
    fontSize: 13,
  },
  preco: {
    fontSize: 17,
    fontWeight: '700',
  },
  cartao: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 11,
  },
  pergunta: {
    flex: 1,
    fontSize: 14,
  },
  resposta: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  acoes: {
    marginTop: 28,
    marginBottom: 12,
    gap: 10,
  },
});
