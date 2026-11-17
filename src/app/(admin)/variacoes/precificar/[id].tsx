// preço sugerido pela IA (/variacoes/precificar/3). o id é o número da variação. manda as características do sabonete para o modelo e mostra o preço recomendado, o mínimo e o máximo do mercado.
import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TemaContext } from '../../../../theme/TemaContext';
import { buscarVariacao } from '../../../../services/variacoes';
import { buscarProdutoAdmin, type Variacao } from '../../../../services/catalogo';
import { preverPreco, analisarPreco, custoPelaFichaTecnica, OPCOES_FORMATO, OPCOES_TIPO_SABONETE, OPCOES_TIPO_PELE, OPCOES_EMBALAGEM, OPCOES_BASE_SABONETE, OPCOES_TIPO_VENDEDOR, type DadosPrecificacao, type ResultadoPrecificacao } from '../../../../services/intelligence';
import { mensagemDeErro } from '../../../../services/api';
import { digitos, mascararDecimal } from '../../../../utils/mascaras';
import { formatarDinheiro, precoAtual } from '../../../../utils/formatar';
import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import SectionTitle from '../../../../components/ui/SectionTitle';
import TextField from '../../../../components/ui/TextField';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import Notice from '../../../../components/ui/Notice';
import ScreenState from '../../../../components/ui/ScreenState';
import PriceEstimate from '../../../../components/ui/PriceEstimate';

function opcoes(lista: string[]) {
  return lista.map(function (texto) {
    return { valor: texto, rotulo: texto };
  });
}

function peleDoProduto(nomes: string[]) {
  if (nomes.length !== 1) {
    return 'Todos os tipos';
  }
  const encontrada = OPCOES_TIPO_PELE.find(function (opcao) {
    return opcao.toLowerCase() === nomes[0].trim().toLowerCase();
  });
  return encontrada ?? 'Todos os tipos';
}

export default function PrecificarVariacao() {
  const { cores } = useContext(TemaContext);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [variacao, setVariacao] = useState<Variacao | null>(null);
  const [nomeProduto, setNomeProduto] = useState('');
  const [peso, setPeso] = useState('');
  const [formato, setFormato] = useState('Barra');
  const [tipoSabonete, setTipoSabonete] = useState('Corporal');
  const [tipoPele, setTipoPele] = useState('Todos os tipos');
  const [embalagem, setEmbalagem] = useState('Não informado');
  const [base, setBase] = useState('Processo a frio');
  const [tipoVendedor, setTipoVendedor] = useState('Artesanal');
  const [custo, setCusto] = useState('');
  const [custoDaFicha, setCustoDaFicha] = useState(false);
  const [margem, setMargem] = useState('');
  const [resultado, setResultado] = useState<ResultadoPrecificacao | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [falhouCarregar, setFalhouCarregar] = useState(false);
  const [calculando, setCalculando] = useState(false);
  const [mostrarCaracteristicas, setMostrarCaracteristicas] = useState(false);
  const [calculouAoAbrir, setCalculouAoAbrir] = useState(false);

  useEffect(
    function () {
      carregar();
    },
    [id]
  );

  useEffect(
    function () {
      if (carregando || !variacao || calculouAoAbrir) {
        return;
      }
      setCalculouAoAbrir(true);
      if (peso) {
        calcular();
      } else {
        setMostrarCaracteristicas(true);
      }
    },
    [carregando, variacao]
  );

  async function carregar() {
    setCarregando(true);
    setFalhouCarregar(false);
    setErroGeral('');
    try {
      const dados = await buscarVariacao(Number(id));
      const [produto, total] = await Promise.all([buscarProdutoAdmin(dados.produto), custoPelaFichaTecnica(dados.id)]);
      setVariacao(dados);
      setNomeProduto(produto.nome);
      setPeso(dados.peso_gramas ? String(dados.peso_gramas) : '');
      setTipoPele(
        peleDoProduto(
          produto.tipo_pele.map(function (pele) {
            return pele.nome;
          })
        )
      );
      if (total > 0) {
        setCusto(total.toFixed(2).replace('.', ','));
        setCustoDaFicha(true);
      }
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar a variação.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  async function calcular() {
    setErroGeral('');
    const novosErros: Record<string, string> = {};
    const pesoNumero = Number(peso);
    const custoNumero = Number(custo.replace(',', '.'));
    const margemNumero = Number(margem);
    if (!peso || pesoNumero < 1) {
      novosErros.peso = 'Informe o peso em gramas.';
      setMostrarCaracteristicas(true);
    }
    if (custo && (Number.isNaN(custoNumero) || custoNumero <= 0)) {
      novosErros.custo = 'Informe um custo maior que zero.';
    }
    if (margem && (margemNumero < 1 || margemNumero > 95)) {
      novosErros.margem = 'Use uma margem entre 1% e 95%.';
    }
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      return;
    }
    const dados: DadosPrecificacao = {
      peso_g: pesoNumero,
      unidade: 1,
      formato: formato,
      tipo_sabonete: tipoSabonete,
      tipo_pele: tipoPele,
      embalagem: embalagem,
      base_sabonete: base,
      tipo_vendedor: tipoVendedor,
    };
    if (custo) {
      dados.custo_unitario = custoNumero;
    }
    if (margem) {
      dados.margem_desejada = margemNumero;
    }
    setCalculando(true);
    setResultado(null);
    try {
      setResultado(await preverPreco(dados));
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível consultar a IA de preços.'));
    } finally {
      setCalculando(false);
    }
  }

  if (carregando || falhouCarregar || !variacao) {
    return (
      <Screen>
        <Header titulo="Preço sugerido pela IA" voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando variação…' : erroGeral}
          aoTentarNovamente={carregando ? undefined : carregar}
        />
      </Screen>
    );
  }

  const custoInformado = Number(custo.replace(',', '.'));
  const analise = resultado
    ? resultado.analise_financeira ?? (custoInformado > 0 ? analisarPreco(resultado.previsao.preco_unitario_estimado, custoInformado, margem ? Number(margem) : undefined) : undefined)
    : undefined;

  return (
    <Screen rolavel>
      <Header titulo="Preço sugerido pela IA" subtitulo={`${nomeProduto} ${variacao.nome} · ${variacao.sku}`} voltar />

      {resultado ? (
        <View style={estilos.resultado}>
          <PriceEstimate
            recomendado={resultado.previsao.preco_unitario_estimado}
            minimo={resultado.previsao.faixa_minima}
            maximo={resultado.previsao.faixa_maxima}
            precoAtual={precoAtual(variacao)}
          />
          {analise ? (
            <View style={[estilos.cartao, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
              <View style={[estilos.linha, { borderColor: cores.borda }]}>
                <Text style={[estilos.rotulo, { color: cores.textoApoio }]}>Lucro por sabonete</Text>
                <Text style={[estilos.valor, { color: analise.lucro_positivo ? cores.sucesso : cores.erro }]}>{formatarDinheiro(analise.lucro_unitario)}</Text>
              </View>
              <View style={[estilos.linha, { borderColor: cores.borda }]}>
                <Text style={[estilos.rotulo, { color: cores.textoApoio }]}>Margem com o preço recomendado</Text>
                <Text style={[estilos.valor, { color: cores.texto }]}>{`${analise.margem_lucro_percentual.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`}</Text>
              </View>
              {analise.preco_minimo_margem_desejada !== undefined ? (
                <View style={[estilos.linha, { borderColor: cores.borda }]}>
                  <Text style={[estilos.rotulo, { color: cores.textoApoio }]}>{`Preço mínimo para ${analise.margem_desejada_percentual ?? margem}% de margem`}</Text>
                  <Text style={[estilos.valor, { color: cores.texto }]}>{formatarDinheiro(analise.preco_minimo_margem_desejada)}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {analise && analise.preco_minimo_margem_desejada !== undefined ? (
            <Notice
              mensagem={
                resultado.previsao.preco_unitario_estimado >= analise.preco_minimo_margem_desejada
                  ? 'O preço recomendado atende à margem que você quer.'
                  : 'O preço recomendado fica abaixo da margem que você quer. Reveja o custo ou a margem.'
              }
              tom={resultado.previsao.preco_unitario_estimado >= analise.preco_minimo_margem_desejada ? 'sucesso' : 'erro'}
            />
          ) : null}
        </View>
      ) : null}

      {erroGeral ? <Notice mensagem={erroGeral} tom="erro" /> : null}

      <View style={estilos.alternar}>
        <Button
          titulo={mostrarCaracteristicas ? 'Esconder características' : `Ajustar características (${peso || '?'} g · ${formato} · ${tipoSabonete})`}
          variante="texto"
          icone={mostrarCaracteristicas ? 'chevron-up' : 'options-outline'}
          aoPressionar={function () {
            setMostrarCaracteristicas(!mostrarCaracteristicas);
          }}
        />
      </View>

      {mostrarCaracteristicas ? (
        <View style={estilos.secao}>
          <TextField
            rotulo="Peso"
            valor={peso}
            aoMudar={function (texto) {
              setPeso(digitos(texto).slice(0, 5));
            }}
            placeholder="Ex.: 90"
            erro={erros.peso}
            sufixo="g"
            teclado="number-pad"
            desabilitado={calculando}
          />
          <Select
            rotulo="Formato"
            opcoes={opcoes(OPCOES_FORMATO)}
            selecionados={[formato]}
            aoMudar={function (valores) {
              if (valores.length > 0) {
                setFormato(String(valores[0]));
              }
            }}
          />
          <Select
            rotulo="Tipo de sabonete"
            opcoes={opcoes(OPCOES_TIPO_SABONETE)}
            selecionados={[tipoSabonete]}
            aoMudar={function (valores) {
              if (valores.length > 0) {
                setTipoSabonete(String(valores[0]));
              }
            }}
          />
          <Select
            rotulo="Tipo de pele"
            opcoes={opcoes(OPCOES_TIPO_PELE)}
            selecionados={[tipoPele]}
            aoMudar={function (valores) {
              if (valores.length > 0) {
                setTipoPele(String(valores[0]));
              }
            }}
          />
          <Select
            rotulo="Base"
            opcoes={opcoes(OPCOES_BASE_SABONETE)}
            selecionados={[base]}
            aoMudar={function (valores) {
              if (valores.length > 0) {
                setBase(String(valores[0]));
              }
            }}
          />
          <Select
            rotulo="Embalagem"
            opcoes={opcoes(OPCOES_EMBALAGEM)}
            selecionados={[embalagem]}
            aoMudar={function (valores) {
              if (valores.length > 0) {
                setEmbalagem(String(valores[0]));
              }
            }}
          />
          <Select
            rotulo="Tipo de vendedor"
            opcoes={opcoes(OPCOES_TIPO_VENDEDOR)}
            selecionados={[tipoVendedor]}
            aoMudar={function (valores) {
              if (valores.length > 0) {
                setTipoVendedor(String(valores[0]));
              }
            }}
          />
        </View>
      ) : null}

      <View style={estilos.secao}>
        <SectionTitle titulo="Custo e margem (opcional)" />
        <TextField
          rotulo="Custo de produção por unidade (R$)"
          valor={custo}
          aoMudar={function (texto) {
            setCusto(mascararDecimal(texto, 2));
            setCustoDaFicha(false);
          }}
          placeholder="Ex.: 12,50"
          erro={erros.custo}
          ajuda={custoDaFicha ? 'Calculado pela ficha técnica com o custo de referência das matérias-primas. Pode alterar.' : 'Preencha para ver lucro e margem.'}
          teclado="decimal-pad"
          desabilitado={calculando}
        />
        <TextField
          rotulo="Margem de lucro desejada"
          valor={margem}
          aoMudar={function (texto) {
            setMargem(digitos(texto).slice(0, 3));
          }}
          placeholder="Ex.: 30"
          erro={erros.margem}
          sufixo="%"
          teclado="number-pad"
          desabilitado={calculando}
        />
      </View>

      <View style={estilos.acoes}>
        <Button titulo={resultado ? 'Calcular de novo' : 'Calcular preço'} icone="sparkles-outline" carregando={calculando} aoPressionar={calcular} />
        <Button
          titulo="Voltar"
          variante="secundario"
          desabilitado={calculando}
          aoPressionar={function () {
            router.back();
          }}
        />
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  alternar: {
    marginTop: 16,
    alignItems: 'center',
  },
  resultado: {
    gap: 12,
    marginTop: 8,
  },
  cartao: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rotulo: {
    flex: 1,
    fontSize: 14,
  },
  valor: {
    fontSize: 16,
    fontWeight: '700',
  },
  secao: {
    marginTop: 24,
    gap: 16,
  },
  acoes: {
    marginTop: 28,
    marginBottom: 12,
    gap: 10,
  },
});
