// detalhe do produto (/produtos/3). O id é o número do produto. mostra dados e variações; editar abre produtos/formulario/[id].
import { useCallback, useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { TemaContext } from '../../../theme/TemaContext';
import { buscarProdutoAdmin, apagarProduto, type Produto, type Variacao } from '../../../services/catalogo';
import { ErroApi, mensagemDeErro } from '../../../services/api';
import { formatarDinheiro, precoAtual, promocaoAtiva } from '../../../utils/formatar';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Badge from '../../../components/ui/Badge';
import SectionTitle from '../../../components/ui/SectionTitle';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';
import Notice from '../../../components/ui/Notice';
import ScreenState from '../../../components/ui/ScreenState';
import ConfirmModal from '../../../components/ui/ConfirmModal';

function subtituloVariacao(variacao: Variacao) {
  const partes = [variacao.sku, `estoque ${variacao.quantidade_estoque}`];
  if (variacao.peso_gramas) {
    partes.push(`${variacao.peso_gramas} g`);
  }
  return partes.join(' · ');
}

function seloVariacao(variacao: Variacao) {
  if (variacao.apagado_em) {
    return { texto: 'Apagada', tom: 'erro' as const };
  }
  if (promocaoAtiva(variacao)) {
    return { texto: 'Promoção', tom: 'destaque' as const };
  }
  return undefined;
}

export default function DetalheProduto() {
  const { cores } = useContext(TemaContext);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [produto, setProduto] = useState<Produto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroAcao, setErroAcao] = useState('');
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [apagando, setApagando] = useState(false);

  useFocusEffect(
    useCallback(
      function () {
        carregar();
      },
      [id]
    )
  );

  async function carregar() {
    setErro('');
    try {
      setProduto(await buscarProdutoAdmin(Number(id)));
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível carregar o produto.'));
    } finally {
      setCarregando(false);
    }
  }

  function tentarNovamente() {
    setCarregando(true);
    carregar();
  }

  async function apagar() {
    setApagando(true);
    try {
      await apagarProduto(Number(id));
      setConfirmandoExclusao(false);
      router.back();
    } catch (e) {
      setConfirmandoExclusao(false);
      if (e instanceof ErroApi && e.codigo === 'registro_protegido') {
        setErroAcao('Este produto tem variações e não pode ser excluído. Para tirá-lo da vitrine, desative-o em "Editar produto".');
      } else {
        setErroAcao(mensagemDeErro(e, 'Não foi possível excluir o produto.'));
      }
    } finally {
      setApagando(false);
    }
  }

  if (carregando || !produto) {
    return (
      <Screen>
        <Header titulo="Produto" voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando produto…' : erro}
          aoTentarNovamente={carregando ? undefined : tentarNovamente}
        />
      </Screen>
    );
  }

  return (
    <Screen rolavel>
      <Header titulo="Produto" voltar />

      {erroAcao ? <Notice mensagem={erroAcao} tom="erro" /> : null}

      <View style={estilos.topo}>
        <Text style={[estilos.nome, { color: cores.texto }]}>{produto.nome}</Text>
        <Badge texto={produto.esta_ativo ? 'Ativo' : 'Desativado'} tom={produto.esta_ativo ? 'sucesso' : 'neutro'} />
      </View>

      <Text style={[estilos.descricao, { color: produto.descricao ? cores.texto : cores.textoApoio }]}>
        {produto.descricao ? produto.descricao : 'Sem descrição.'}
      </Text>

      <Text style={[estilos.data, { color: cores.textoApoio }]}>
        Criado em {new Date(produto.criado_em).toLocaleDateString('pt-BR')}
      </Text>

      <View style={estilos.secao}>
        <SectionTitle titulo="Categorias" />
        <View style={estilos.selos}>
          {produto.categorias.length > 0 ? (
            produto.categorias.map(function (categoria) {
              return <Badge key={categoria.id} texto={categoria.nome} tom="neutro" />;
            })
          ) : (
            <Text style={[estilos.vazio, { color: cores.textoApoio }]}>Nenhuma categoria.</Text>
          )}
        </View>
      </View>

      <View style={estilos.secao}>
        <SectionTitle titulo="Tipos de pele" />
        <View style={estilos.selos}>
          {produto.tipo_pele.length > 0 ? (
            produto.tipo_pele.map(function (tipo) {
              return <Badge key={tipo.id} texto={tipo.nome} tom="neutro" />;
            })
          ) : (
            <Text style={[estilos.vazio, { color: cores.textoApoio }]}>Nenhum tipo de pele.</Text>
          )}
        </View>
      </View>

      <View style={estilos.secao}>
        <SectionTitle
          titulo="Variações"
          textoAcao="Nova variação"
          aoPressionarAcao={function () {
            router.push(`/variacoes/formulario/novo?produto=${produto.id}` as Href);
          }}
        />
        {produto.variacoes.length > 0 ? (
          produto.variacoes.map(function (variacao) {
            return (
              <ListItem
                key={variacao.id}
                titulo={variacao.nome}
                subtitulo={subtituloVariacao(variacao)}
                detalhe={formatarDinheiro(precoAtual(variacao))}
                selo={seloVariacao(variacao)}
                aoPressionar={function () {
                  router.push(`/variacoes/${variacao.id}` as Href);
                }}
              />
            );
          })
        ) : (
          <Text style={[estilos.vazio, { color: cores.textoApoio }]}>
            Nenhuma variação ainda. Crie a primeira para o produto ter preço na vitrine.
          </Text>
        )}
      </View>

      <View style={estilos.acoes}>
        <Button
          titulo="Editar produto"
          variante="secundario"
          icone="create-outline"
          aoPressionar={function () {
            router.push(`/produtos/formulario/${produto.id}`);
          }}
        />
      </View>

      <View style={estilos.perigo}>
        <Button
          titulo="Excluir produto"
          variante="textoPerigo"
          icone="trash-outline"
          aoPressionar={function () {
            setErroAcao('');
            setConfirmandoExclusao(true);
          }}
        />
      </View>

      <ConfirmModal
        visivel={confirmandoExclusao}
        titulo="Excluir produto?"
        mensagem={`"${produto.nome}" será apagado. Se ele tiver variações, a exclusão será recusada e você pode desativá-lo.`}
        textoConfirmar="Excluir"
        perigo
        carregando={apagando}
        aoConfirmar={apagar}
        aoCancelar={function () {
          setConfirmandoExclusao(false);
        }}
      />
    </Screen>
  );
}

const estilos = StyleSheet.create({
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  nome: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  descricao: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  data: {
    fontSize: 13,
    marginTop: 6,
  },
  secao: {
    marginTop: 24,
    gap: 10,
  },
  selos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  vazio: {
    fontSize: 14,
  },
  acoes: {
    marginTop: 28,
  },
  perigo: {
    marginTop: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
});