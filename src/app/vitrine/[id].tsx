// página pública do produto (/vitrine/3). O id é o número do produto. só leitura: variações, preço e botão do wpp.
import { useContext, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TemaContext } from '../../theme/TemaContext';
import { buscarProduto, type Produto, type Variacao } from '../../services/catalogo';
import { mensagemDeErro } from '../../services/api';
import { formatarDinheiro, precoAtual, promocaoAtiva, variacoesDisponiveis } from '../../utils/formatar';
import { linkWhatsapp, whatsappDisponivel } from '../../utils/whatsapp';
import Screen from '../../components/ui/Screen';
import Chip from '../../components/ui/Chip';
import SectionTitle from '../../components/ui/SectionTitle';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Notice from '../../components/ui/Notice';
import ScreenState from '../../components/ui/ScreenState';
import ThemeToggle from '../../components/ui/ThemeToggle';

export default function PaginaProduto() {
  const { cores } = useContext(TemaContext);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [produto, setProduto] = useState<Produto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroWhatsapp, setErroWhatsapp] = useState('');

  useEffect(function () {
    carregar();
  }, [id]);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      setProduto(await buscarProduto(Number(id)));
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível carregar este sabonete.'));
    } finally {
      setCarregando(false);
    }
  }

  function voltar() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/vitrine');
    }
  }

  function filtrarPorCategoria(categoriaId: number) {
    router.dismissTo({ pathname: '/vitrine', params: { categoria: String(categoriaId) } });
  }

  function filtrarPorTipoPele(tipoPeleId: number) {
    router.dismissTo({ pathname: '/vitrine', params: { tipoPele: String(tipoPeleId) } });
  }

  async function abrirWhatsapp() {
    if (!produto) {
      return;
    }
    setErroWhatsapp('');
    try {
      await Linking.openURL(linkWhatsapp(`Estou interessado no produto '${produto.nome}'`));
    } catch {
      setErroWhatsapp('Não foi possível abrir o WhatsApp neste aparelho.');
    }
  }

  function renderizarVariacao(variacao: Variacao) {
    const emPromocao = promocaoAtiva(variacao);
    const temEstoque = variacao.quantidade_estoque > 0;

    return (
      <View
        key={variacao.id}
        style={[
          estilos.variacao,
          {
            backgroundColor: cores.cartao,
            borderColor: cores.borda,
            boxShadow: `0px 4px 12px ${cores.sombraCartao}`,
          },
        ]}
      >
        <View style={estilos.variacaoInfo}>
          <Text style={[estilos.variacaoNome, { color: cores.texto }]}>{variacao.nome}</Text>
          {variacao.peso_gramas ? (
            <Text style={[estilos.variacaoPeso, { color: cores.textoApoio }]}>{variacao.peso_gramas} g</Text>
          ) : null}
          <View style={estilos.selos}>
            <Badge texto={temEstoque ? 'Disponível' : 'Esgotado'} tom={temEstoque ? 'sucesso' : 'erro'} />
            {emPromocao ? <Badge texto="Promoção" tom="destaque" /> : null}
          </View>
        </View>
        <View style={estilos.precos}>
          {emPromocao ? (
            <Text style={[estilos.precoAntigo, { color: cores.textoApoio }]}>{formatarDinheiro(variacao.preco)}</Text>
          ) : null}
          <Text style={[estilos.preco, { color: cores.texto }]}>{formatarDinheiro(precoAtual(variacao))}</Text>
        </View>
      </View>
    );
  }

  const topo = (
    <View style={estilos.topo}>
      <Pressable
        onPress={voltar}
        accessibilityRole="button"
        accessibilityLabel="Voltar para a vitrine"
        hitSlop={8}
        style={estilos.voltar}
      >
        <Ionicons name="chevron-back" size={22} color={cores.texto} />
        <Text style={[estilos.textoVoltar, { color: cores.texto }]}>Vitrine</Text>
      </Pressable>
      <ThemeToggle />
    </View>
  );

  if (carregando || !produto) {
    return (
      <Screen>
        {topo}
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando sabonete…' : erro}
          aoTentarNovamente={carregando ? undefined : carregar}
        />
      </Screen>
    );
  }

  const variacoes = variacoesDisponiveis(produto);

  const rodape = whatsappDisponivel() ? (
    <View style={estilos.rodape}>
      {erroWhatsapp ? <Notice mensagem={erroWhatsapp} tom="erro" /> : null}
      <Button titulo="Quero este sabonete" icone="logo-whatsapp" aoPressionar={abrirWhatsapp} />
    </View>
  ) : undefined;

  return (
    <Screen rolavel rodape={rodape}>
      {topo}

      <Text style={[estilos.nome, { color: cores.texto }]}>{produto.nome}</Text>
      {produto.descricao ? (
        <Text style={[estilos.descricao, { color: cores.textoApoio }]}>{produto.descricao}</Text>
      ) : null}

      {produto.categorias.length > 0 ? (
        <View style={estilos.secao}>
          <SectionTitle titulo="Categorias" />
          <View style={estilos.chips}>
            {produto.categorias.map(function (categoria) {
              return (
                <Chip
                  key={categoria.id}
                  rotulo={categoria.nome}
                  selecionado={false}
                  aoPressionar={function () {
                    filtrarPorCategoria(categoria.id);
                  }}
                />
              );
            })}
          </View>
        </View>
      ) : null}

      {produto.tipo_pele.length > 0 ? (
        <View style={estilos.secao}>
          <SectionTitle titulo="Indicado para" />
          <View style={estilos.chips}>
            {produto.tipo_pele.map(function (tipo) {
              return (
                <Chip
                  key={tipo.id}
                  rotulo={`Pele ${tipo.nome.toLowerCase()}`}
                  selecionado={false}
                  aoPressionar={function () {
                    filtrarPorTipoPele(tipo.id);
                  }}
                />
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={estilos.secao}>
        <SectionTitle titulo="Opções" />
        {variacoes.length > 0 ? (
          variacoes.map(renderizarVariacao)
        ) : (
          <Text style={[estilos.vazio, { color: cores.textoApoio }]}>Este sabonete ainda não tem opções à venda.</Text>
        )}
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    gap: 2,
  },
  textoVoltar: {
    fontSize: 16,
    fontWeight: '600',
  },
  nome: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  descricao: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  secao: {
    marginTop: 24,
    gap: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variacao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  variacaoInfo: {
    flex: 1,
    gap: 4,
  },
  variacaoNome: {
    fontSize: 16,
    fontWeight: '600',
  },
  variacaoPeso: {
    fontSize: 13,
  },
  selos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  precos: {
    alignItems: 'flex-end',
  },
  precoAntigo: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  preco: {
    fontSize: 18,
    fontWeight: '700',
  },
  vazio: {
    fontSize: 14,
  },
  rodape: {
    gap: 10,
  },
});