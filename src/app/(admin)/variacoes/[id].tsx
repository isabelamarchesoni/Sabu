// detalhe da variação (/variacoes/3). o id é o número da variação. mostra dados, estoque, ficha técnica e lotes; editar abre variacoes/formulario/[id].
import { useCallback, useContext, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { TemaContext } from '../../../theme/TemaContext';
import { buscarProdutoAdmin, type Variacao } from '../../../services/catalogo';
import { buscarVariacao, apagarVariacao, restaurarVariacao } from '../../../services/variacoes';
import { listarFichasDaVariacao, listarLotesDaVariacao, type FichaTecnica, type LoteVariacao, type StatusLote } from '../../../services/estoque';
import { mensagemDeErro } from '../../../services/api';
import { formatarDinheiro, paraNumero, promocaoAtiva } from '../../../utils/formatar';
import { formatarData } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import Badge from '../../../components/ui/Badge';
import SectionTitle from '../../../components/ui/SectionTitle';
import ListItem from '../../../components/ui/ListItem';
import Button from '../../../components/ui/Button';
import Notice from '../../../components/ui/Notice';
import ScreenState from '../../../components/ui/ScreenState';
import ConfirmModal from '../../../components/ui/ConfirmModal';

const SELO_STATUS: Record<StatusLote, { texto: string; tom: 'sucesso' | 'neutro' | 'erro' }> = {
  ATIVO: { texto: 'Ativo', tom: 'sucesso' },
  ESGOTADO: { texto: 'Esgotado', tom: 'neutro' },
  VENCIDO: { texto: 'Vencido', tom: 'erro' },
};

function textoPromocao(variacao: Variacao) {
  if (!variacao.preco_promo) {
    return 'Sem promoção';
  }
  const partes = [formatarDinheiro(variacao.preco_promo)];
  if (variacao.inicio_promo) {
    partes.push(`de ${formatarData(variacao.inicio_promo)}`);
  }
  if (variacao.fim_promo) {
    partes.push(`até ${formatarData(variacao.fim_promo)}`);
  }
  partes.push(promocaoAtiva(variacao) ? '(valendo agora)' : '(fora do período)');
  return partes.join(' ');
}

function quantidadeFicha(ficha: FichaTecnica) {
  return `${paraNumero(ficha.quantidade_necessaria).toLocaleString('pt-BR')} ${ficha.materia_prima.unidade_medida.toLowerCase()} por sabonete`;
}

export default function DetalheVariacao() {
  const { cores } = useContext(TemaContext);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [variacao, setVariacao] = useState<Variacao | null>(null);
  const [nomeProduto, setNomeProduto] = useState('');
  const [fichas, setFichas] = useState<FichaTecnica[]>([]);
  const [lotes, setLotes] = useState<LoteVariacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [erroAcao, setErroAcao] = useState('');
  const [aviso, setAviso] = useState('');
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [processando, setProcessando] = useState(false);

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
      const dados = await buscarVariacao(Number(id));
      const [produto, listaFichas, listaLotes] = await Promise.all([buscarProdutoAdmin(dados.produto), listarFichasDaVariacao(dados.id), listarLotesDaVariacao(dados.id)]);
      setVariacao(dados);
      setNomeProduto(produto.nome);
      setFichas(listaFichas);
      setLotes(listaLotes);
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível carregar a variação.'));
    } finally {
      setCarregando(false);
    }
  }

  function tentarNovamente() {
    setCarregando(true);
    carregar();
  }

  async function apagar() {
    setProcessando(true);
    setErroAcao('');
    try {
      await apagarVariacao(Number(id));
      setConfirmandoExclusao(false);
      setAviso('Variação apagada. As fichas técnicas dela também foram apagadas; os lotes continuam existindo.');
      await carregar();
    } catch (e) {
      setConfirmandoExclusao(false);
      setErroAcao(mensagemDeErro(e, 'Não foi possível apagar a variação.'));
    } finally {
      setProcessando(false);
    }
  }

  async function restaurar() {
    setProcessando(true);
    setErroAcao('');
    try {
      await restaurarVariacao(Number(id));
      setAviso('Variação restaurada. As fichas técnicas não voltam sozinhas: restaure-as à parte.');
      await carregar();
    } catch (e) {
      setErroAcao(mensagemDeErro(e, 'Não foi possível restaurar a variação.'));
    } finally {
      setProcessando(false);
    }
  }

  function linha(rotulo: string, valor: string) {
    return (
      <View style={[estilos.linha, { borderColor: cores.borda }]}>
        <Text style={[estilos.rotulo, { color: cores.textoApoio }]}>{rotulo}</Text>
        <Text style={[estilos.valor, { color: cores.texto }]}>{valor}</Text>
      </View>
    );
  }

  if (carregando || !variacao) {
    return (
      <Screen>
        <Header titulo="Variação" voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando variação…' : erro}
          aoTentarNovamente={carregando ? undefined : tentarNovamente}
        />
      </Screen>
    );
  }

  const apagada = variacao.apagado_em !== null;

  return (
    <Screen rolavel>
      <Header titulo="Variação" voltar />

      {apagada ? <Notice mensagem="Esta variação está apagada e não aparece na vitrine. Restaure para voltar a vender." tom="erro" /> : null}
      {aviso ? <Notice mensagem={aviso} tom="sucesso" /> : null}
      {erroAcao ? <Notice mensagem={erroAcao} tom="erro" /> : null}

      {variacao.imagem ? (
        <Image
          source={{ uri: variacao.imagem }}
          style={[estilos.imagem, { backgroundColor: cores.borda }]}
          resizeMode="cover"
          accessibilityLabel={`Imagem de ${variacao.nome}`}
        />
      ) : null}

      <View style={estilos.topo}>
        <Text style={[estilos.nome, { color: cores.texto }]}>{variacao.nome}</Text>
        <Badge texto={apagada ? 'Apagada' : 'Ativa'} tom={apagada ? 'erro' : 'sucesso'} />
      </View>

      <Button
        titulo={`Ver produto: ${nomeProduto}`}
        variante="texto"
        icone="arrow-forward"
        aoPressionar={function () {
          router.push(`/produtos/${variacao.produto}`);
        }}
      />

      <View style={[estilos.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
        {linha('SKU', variacao.sku)}
        {linha('Preço', formatarDinheiro(variacao.preco))}
        {linha('Promoção', textoPromocao(variacao))}
        {linha('Peso', variacao.peso_gramas ? `${variacao.peso_gramas} g` : 'Não informado')}
        {linha('Estoque atual', `${variacao.quantidade_estoque} ${variacao.quantidade_estoque === 1 ? 'unidade' : 'unidades'}`)}
      </View>

      <View style={estilos.secao}>
        <SectionTitle
          titulo="Ficha técnica"
          textoAcao="Adicionar"
          aoPressionarAcao={function () {
            router.push(`/fichas-tecnicas/novo?variacao=${variacao.id}` as Href);
          }}
        />
        {fichas.length > 0 ? (
          fichas.map(function (ficha) {
            return (
              <ListItem
                key={ficha.id}
                titulo={ficha.materia_prima.nome}
                subtitulo={ficha.materia_prima.sku}
                detalhe={quantidadeFicha(ficha)}
                aoPressionar={function () {
                  router.push(`/fichas-tecnicas/${ficha.id}` as Href);
                }}
              />
            );
          })
        ) : (
          <Text style={[estilos.vazio, { color: cores.textoApoio }]}>
            Sem ficha técnica. Sem ela não dá para fabricar esta variação.
          </Text>
        )}
      </View>

      <View style={estilos.secao}>
        <SectionTitle
          titulo="Lotes"
          textoAcao="Ver movimentações"
          aoPressionarAcao={function () {
            router.push(`/movimentacoes-sabonetes?variacao=${variacao.id}` as Href);
          }}
        />
        {lotes.length > 0 ? (
          lotes.map(function (lote) {
            return (
              <ListItem
                key={lote.id}
                titulo={lote.numero_lote}
                subtitulo={`validade ${formatarData(lote.data_validade)} · ${lote.quantidade_atual} de ${lote.quantidade_inicial}`}
                selo={SELO_STATUS[lote.status]}
                aoPressionar={function () {
                  router.push(`/lotes-sabonetes/${lote.id}` as Href);
                }}
              />
            );
          })
        ) : (
          <Text style={[estilos.vazio, { color: cores.textoApoio }]}>Nenhum lote ainda.</Text>
        )}
      </View>

      <View style={estilos.acoes}>
        {!apagada ? (
          <Button
            titulo="Fabricar"
            icone="flask-outline"
            aoPressionar={function () {
              router.push(`/variacoes/fabricar/${variacao.id}` as Href);
            }}
          />
        ) : null}
        {!apagada ? (
          <Button
            titulo="Preço sugerido pela IA"
            variante="secundario"
            icone="sparkles-outline"
            aoPressionar={function () {
              router.push(`/variacoes/precificar/${variacao.id}` as Href);
            }}
          />
        ) : null}
        <Button
          titulo="Editar variação"
          variante="secundario"
          icone="create-outline"
          aoPressionar={function () {
            router.push(`/variacoes/formulario/${variacao.id}`);
          }}
        />
        {apagada ? (
          <Button titulo="Restaurar variação" variante="secundario" icone="refresh" carregando={processando} aoPressionar={restaurar} />
        ) : null}
      </View>

      {!apagada ? (
        <View style={estilos.perigo}>
          <Button
            titulo="Excluir variação"
            variante="textoPerigo"
            icone="trash-outline"
            aoPressionar={function () {
              setAviso('');
              setErroAcao('');
              setConfirmandoExclusao(true);
            }}
          />
        </View>
      ) : null}

      <ConfirmModal
        visivel={confirmandoExclusao}
        titulo="Excluir variação?"
        mensagem={`"${variacao.nome}" sai da vitrine e as fichas técnicas dela também são apagadas. Os lotes continuam existindo, e dá para restaurar depois.`}
        textoConfirmar="Excluir"
        perigo
        carregando={processando}
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
  cartao: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rotulo: {
    fontSize: 14,
  },
  valor: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  secao: {
    marginTop: 24,
    gap: 10,
  },
  vazio: {
    fontSize: 14,
  },
  acoes: {
    marginTop: 28,
    gap: 10,
  },
  perigo: {
    marginTop: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  imagem: {
    width: 200,
    height: 200,
    borderRadius: 18,
    marginBottom: 16,
  },
});