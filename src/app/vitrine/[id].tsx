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
import { mensagemPedidoVitrine } from '../../utils/mensagens';
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
  const [variacaoId, setVariacaoId] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState(1);

  useEffect(function () {
    carregar();
  }, [id]);

  async function carregar() {
    setCarregando(true);
    setErro('');
    try {
      const dados = await buscarProduto(Number(id));
      setProduto(dados);
      const primeira = variacoesDisponiveis(dados).find(function (variacao) {
        return variacao.quantidade_estoque > 0;
      });
      setVariacaoId(primeira ? primeira.id : null);
      setQuantidade(1);
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
    const escolhida = variacoesDisponiveis(produto).find(function (variacao) {
      return variacao.id === variacaoId;
    });
    const mensagem = escolhida ? mensagemPedidoVitrine(produto, escolhida, quantidade) : `🧼 Oi! Tenho interesse no sabonete *${produto.nome}* da Sabu. Ele vai voltar ao estoque? 🐸`;
    try {
      await Linking.openURL(linkWhatsapp(mensagem));
    } catch {
      setErroWhatsapp('Não foi possível abrir o WhatsApp neste aparelho.');
    }
  }

  function renderizarVariacao(variacao: Variacao) {
    const emPromocao = promocaoAtiva(variacao);
    const temEstoque = variacao.quantidade_estoque > 0;
    const selecionada = variacao.id === variacaoId;

    return (
      <Pressable
        key={variacao.id}
        onPress={function () {
          setVariacaoId(variacao.id);
          setQuantidade(1);
        }}
        disabled={!temEstoque}
        accessibilityRole="radio"
        accessibilityState={{ selected: selecionada, disabled: !temEstoque }}
        style={[
          estilos.variacao,
          {
            backgroundColor: cores.cartao,
            borderColor: selecionada ? cores.botao : cores.borda,
            borderWidth: selecionada ? 2 : 1,
            opacity: temEstoque ? 1 : 0.6,
            boxShadow: `0px 4px 12px ${cores.sombraCartao}`,
          },
        ]}
      >
        <Ionicons name={selecionada ? 'radio-button-on' : 'radio-button-off'} size={22} color={selecionada ? cores.botao : cores.placeholder} />
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
      </Pressable>
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

  const escolhida = variacoes.find(function (variacao) {
    return variacao.id === variacaoId;
  });
  const limite = escolhida ? Math.min(escolhida.quantidade_estoque, 99) : 1;

  const rodape = whatsappDisponivel() ? (
    <View style={estilos.rodape}>
      {erroWhatsapp ? <Notice mensagem={erroWhatsapp} tom="erro" /> : null}
      {escolhida ? (
        <View style={estilos.linhaPedido}>
          <View style={[estilos.quantidade, { borderColor: cores.bordaForte, backgroundColor: cores.cartao }]}>
            <Pressable
              onPress={function () {
                setQuantidade(Math.max(1, quantidade - 1));
              }}
              disabled={quantidade <= 1}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Diminuir quantidade"
              style={estilos.botaoQuantidade}
            >
              <Ionicons name="remove" size={20} color={quantidade <= 1 ? cores.placeholder : cores.texto} />
            </Pressable>
            <Text style={[estilos.numeroQuantidade, { color: cores.texto }]}>{quantidade}</Text>
            <Pressable
              onPress={function () {
                setQuantidade(Math.min(limite, quantidade + 1));
              }}
              disabled={quantidade >= limite}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Aumentar quantidade"
              style={estilos.botaoQuantidade}
            >
              <Ionicons name="add" size={20} color={quantidade >= limite ? cores.placeholder : cores.texto} />
            </Pressable>
          </View>
          <View style={estilos.botaoPedir}>
            <Button titulo={`Pedir · ${formatarDinheiro(precoAtual(escolhida) * quantidade)}`} icone="logo-whatsapp" aoPressionar={abrirWhatsapp} />
          </View>
        </View>
      ) : (
        <Button titulo="Avisar quando voltar" icone="logo-whatsapp" variante="secundario" aoPressionar={abrirWhatsapp} />
      )}
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
        <SectionTitle titulo="Escolha a opção" />
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
  linhaPedido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantidade: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 4,
  },
  botaoQuantidade: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroQuantidade: {
    minWidth: 24,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  botaoPedir: {
    flex: 1,
  },
});