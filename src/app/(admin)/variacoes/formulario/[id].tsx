// formulário de variação. /variacoes/formulario/novo cria (aceita ?produto=ID para já vir escolhido); /variacoes/formulario/3 edita a variação de id 3.
import { useContext, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { TemaContext } from '../../../../theme/TemaContext';
import { listarProdutosAdmin, type Produto } from '../../../../services/catalogo';
import {
  buscarVariacao,
  salvarVariacao,
  enviarImagemVariacao,
  apagarImagemVariacao,
  type ArquivoImagem,
  type DadosVariacao,
} from '../../../../services/variacoes';
import { mensagemDeErro } from '../../../../services/api';
import { digitos, mascararData, mascararDecimal } from '../../../../utils/mascaras';
import { erroDoCampo } from '../../../../utils/erros';
import { formatarData, lerData } from '../../../../utils/datas';
import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import TextField from '../../../../components/ui/TextField';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import Notice from '../../../../components/ui/Notice';
import ScreenState from '../../../../components/ui/ScreenState';
import SectionTitle from '../../../../components/ui/SectionTitle';

const LIMITE_TEXTO = 50;
const PADRAO_PRECO = /^\d{1,8}(\.\d{1,2})?$/;
const CAMPOS = ['produto', 'sku', 'nome', 'preco', 'preco_promo', 'inicio_promo', 'fim_promo', 'peso_gramas'];

function normalizarDecimal(texto: string) {
  const limpo = texto.trim();
  return limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
}

function decimalParaCampo(valor: string | null) {
  return valor ? valor.replace('.', ',') : '';
}

export default function FormularioVariacao() {
  const { cores } = useContext(TemaContext);
  const { id, produto } = useLocalSearchParams<{ id: string; produto?: string }>();
  const criando = id === 'novo';

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoId, setProdutoId] = useState<number | null>(criando && produto ? Number(produto) : null);
  const [sku, setSku] = useState('');
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [precoPromo, setPrecoPromo] = useState('');
  const [inicioPromo, setInicioPromo] = useState('');
  const [fimPromo, setFimPromo] = useState('');
  const [peso, setPeso] = useState('');
  const [estoque, setEstoque] = useState<number | null>(null);
  const [imagemAtual, setImagemAtual] = useState<string | null>(null);
  const [imagemNova, setImagemNova] = useState<ArquivoImagem | null>(null);
  const [idCriado, setIdCriado] = useState<number | null>(null);
  const [apagandoImagem, setApagandoImagem] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [carregando, setCarregando] = useState(!criando);
  const [falhouCarregar, setFalhouCarregar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // id da variação no servidor: o da rota, ou o que acabou de ser criado nesta tela
  const idAtual = idCriado ?? (criando ? null : Number(id));
  const previa = imagemNova ? imagemNova.uri : imagemAtual;

  useEffect(function () {
    carregarProdutos();
  }, []);

  useEffect(function () {
    if (!criando) {
      carregarVariacao();
    }
  }, [id]);

  async function carregarProdutos() {
    try {
      const resposta = await listarProdutosAdmin({ pagina: 1 });
      setProdutos(resposta.results);
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar a lista de produtos.'));
    }
  }

  async function carregarVariacao() {
    setCarregando(true);
    setFalhouCarregar(false);
    try {
      const variacao = await buscarVariacao(Number(id));
      setProdutoId(variacao.produto);
      setSku(variacao.sku);
      setNome(variacao.nome);
      setPreco(decimalParaCampo(variacao.preco));
      setPrecoPromo(decimalParaCampo(variacao.preco_promo));
      setInicioPromo(formatarData(variacao.inicio_promo));
      setFimPromo(formatarData(variacao.fim_promo));
      setPeso(variacao.peso_gramas ? String(variacao.peso_gramas) : '');
      setEstoque(variacao.quantidade_estoque);
      setImagemAtual(variacao.imagem);
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar a variação.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  async function escolherImagem() {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (resultado.canceled) {
      return;
    }
    const arquivo = resultado.assets[0];
    setImagemNova({
      uri: arquivo.uri,
      nome: arquivo.fileName ?? 'imagem.jpg',
      tipo: arquivo.mimeType ?? 'image/jpeg',
    });
  }

  async function removerImagem() {
    // imagem recém-escolhida e ainda não enviada: só descarta a prévia
    if (imagemNova) {
      setImagemNova(null);
      return;
    }
    if (idAtual === null) {
      return;
    }
    setErroGeral('');
    setApagandoImagem(true);
    try {
      await apagarImagemVariacao(idAtual);
      setImagemAtual(null);
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível excluir a imagem.'));
    } finally {
      setApagandoImagem(false);
    }
  }

  function montarDados(): DadosVariacao | null {
    const novosErros: Record<string, string> = {};
    const skuLimpo = sku.trim();
    const nomeLimpo = nome.trim();
    const precoLimpo = normalizarDecimal(preco);
    const promoLimpo = normalizarDecimal(precoPromo);
    const inicio = inicioPromo.trim() ? lerData(inicioPromo) : null;
    const fim = fimPromo.trim() ? lerData(fimPromo) : null;
    const pesoLimpo = peso.trim();

    if (produtoId === null) {
      novosErros.produto = 'Escolha o produto.';
    }
    if (!skuLimpo) {
      novosErros.sku = 'Informe o SKU.';
    } else if (skuLimpo.length > LIMITE_TEXTO) {
      novosErros.sku = `Use no máximo ${LIMITE_TEXTO} caracteres.`;
    }
    if (!nomeLimpo) {
      novosErros.nome = 'Informe o nome da variação.';
    } else if (nomeLimpo.length > LIMITE_TEXTO) {
      novosErros.nome = `Use no máximo ${LIMITE_TEXTO} caracteres.`;
    }
    if (!PADRAO_PRECO.test(precoLimpo) || Number(precoLimpo) <= 0) {
      novosErros.preco = 'Informe um preço válido, ex.: 18,90.';
    }
    if (promoLimpo) {
      if (!PADRAO_PRECO.test(promoLimpo) || Number(promoLimpo) <= 0) {
        novosErros.preco_promo = 'Informe um preço válido, ex.: 15,90.';
      } else if (!novosErros.preco && Number(promoLimpo) >= Number(precoLimpo)) {
        novosErros.preco_promo = 'O preço promocional precisa ser menor que o preço.';
      }
    }
    if (inicioPromo.trim() && !inicio) {
      novosErros.inicio_promo = 'Use o formato dd/mm/aaaa.';
    }
    if (fimPromo.trim() && !fim) {
      novosErros.fim_promo = 'Use o formato dd/mm/aaaa.';
    }
    if (inicio && fim && fim < inicio) {
      novosErros.fim_promo = 'O fim precisa ser no mesmo dia ou depois do início.';
    }
    if (pesoLimpo && (!/^\d+$/.test(pesoLimpo) || Number(pesoLimpo) < 1)) {
      novosErros.peso_gramas = 'Use um número inteiro a partir de 1.';
    }

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0 || produtoId === null) {
      return null;
    }

    if (fim) {
      fim.setHours(23, 59, 59);
    }

    return {
      produto: produtoId,
      sku: skuLimpo,
      nome: nomeLimpo,
      preco: precoLimpo,
      preco_promo: promoLimpo ? promoLimpo : null,
      inicio_promo: promoLimpo && inicio ? inicio.toISOString() : null,
      fim_promo: promoLimpo && fim ? fim.toISOString() : null,
      peso_gramas: pesoLimpo ? Number(pesoLimpo) : null,
    };
  }

  async function salvar() {
    setErroGeral('');
    const dados = montarDados();
    if (!dados) {
      return;
    }
    setSalvando(true);
    try {
      // 1) JSON: cria ou atualiza os dados da variação
      const salva = await salvarVariacao(idAtual, dados);

      // 2) multipart: só depois do sucesso acima, envia a imagem
      if (imagemNova) {
        try {
          await enviarImagemVariacao(salva.id, imagemNova);
          setImagemAtual(imagemNova.uri);
          setImagemNova(null);
        } catch (e) {
          // a variação já existe: passa a editá-la e deixa o usuário tentar de novo
          setIdCriado(salva.id);
          setErroGeral(
            mensagemDeErro(e, 'Não foi possível enviar a imagem.') +
              ' Os dados da variação foram salvos; toque em Salvar para tentar enviar a imagem novamente.'
          );
          return;
        }
      }

      if (criando) {
        router.replace(`/variacoes/${salva.id}`);
      } else {
        router.back();
      }
    } catch (e) {
      const novosErros: Record<string, string> = {};
      for (const campo of CAMPOS) {
        const mensagem = erroDoCampo(e, campo);
        if (mensagem) {
          novosErros[campo] = mensagem;
        }
      }
      if (Object.keys(novosErros).length > 0) {
        setErros(novosErros);
      } else {
        setErroGeral(mensagemDeErro(e, 'Não foi possível salvar a variação.'));
      }
    } finally {
      setSalvando(false);
    }
  }

  const titulo = criando ? 'Nova variação' : 'Editar variação';

  if (carregando || falhouCarregar) {
    return (
      <Screen>
        <Header titulo={titulo} voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando variação…' : erroGeral}
          aoTentarNovamente={carregando ? undefined : carregarVariacao}
        />
      </Screen>
    );
  }

  return (
    <Screen rolavel>
      <Header titulo={titulo} voltar />

      {erroGeral ? <Notice mensagem={erroGeral} tom="erro" /> : null}

      <View style={estilos.campos}>
        <View style={estilos.imagemBloco}>
          {previa ? (
            <Image source={{ uri: previa }} style={[estilos.imagem, { backgroundColor: cores.borda }]} resizeMode="cover" />
          ) : (
            <View style={[estilos.imagem, estilos.semImagem, { backgroundColor: cores.borda }]} />
          )}
          <View style={estilos.imagemAcoes}>
            <Button
              titulo={previa ? 'Trocar imagem' : 'Escolher imagem'}
              variante="secundario"
              icone="image-outline"
              desabilitado={salvando || apagandoImagem}
              aoPressionar={escolherImagem}
            />
            {previa ? (
              <Button
                titulo="Excluir imagem"
                variante="textoPerigo"
                icone="trash-outline"
                carregando={apagandoImagem}
                desabilitado={salvando}
                aoPressionar={removerImagem}
              />
            ) : null}
          </View>
        </View>

        <Select
          rotulo="Produto"
          opcoes={produtos.map(function (item) {
            return { valor: item.id, rotulo: item.nome };
          })}
          selecionados={produtoId === null ? [] : [produtoId]}
          aoMudar={function (valores) {
            setProdutoId(valores.length > 0 ? Number(valores[0]) : null);
          }}
          placeholder="Escolha o produto"
          erro={erros.produto}
        />

        <TextField
          rotulo="SKU"
          valor={sku}
          aoMudar={setSku}
          placeholder="Ex.: LAV-90"
          erro={erros.sku}
          ajuda="Código da variação, até 50 caracteres."
          maiusculas="characters"
          desabilitado={salvando}
        />

        <TextField
          rotulo="Nome"
          valor={nome}
          aoMudar={setNome}
          placeholder="Ex.: 90 g"
          erro={erros.nome}
          ajuda="Até 50 caracteres."
          desabilitado={salvando}
        />

        <TextField
          rotulo="Preço (R$)"
          valor={preco}
          aoMudar={function (texto) {
            setPreco(mascararDecimal(texto, 2));
          }}
          placeholder="18,90"
          erro={erros.preco}
          teclado="decimal-pad"
          desabilitado={salvando}
        />

        <TextField
          rotulo="Peso (g)"
          valor={peso}
          aoMudar={function (texto) {
            setPeso(digitos(texto));
          }}
          placeholder="90"
          erro={erros.peso_gramas}
          ajuda="Opcional."
          teclado="number-pad"
          desabilitado={salvando}
        />

        {estoque !== null ? (
          <TextField
            rotulo="Estoque atual"
            valor={`${estoque}`}
            aoMudar={function () {}}
            ajuda="Só para consulta: muda com fabricação, vendas e movimentações."
            desabilitado
          />
        ) : null}
      </View>

      <View style={estilos.secao}>
        <SectionTitle titulo="Promoção (opcional)" />
        <TextField
          rotulo="Preço promocional (R$)"
          valor={precoPromo}
          aoMudar={function (texto) {
            setPrecoPromo(mascararDecimal(texto, 2));
          }}
          placeholder="15,90"
          erro={erros.preco_promo}
          ajuda="Deixe vazio para não ter promoção."
          teclado="decimal-pad"
          desabilitado={salvando}
        />
        <TextField
          rotulo="Início"
          valor={inicioPromo}
          aoMudar={function (texto) {
            setInicioPromo(mascararData(texto));
          }}
          placeholder="dd/mm/aaaa"
          erro={erros.inicio_promo}
          ajuda="Vazio = começa já."
          teclado="numbers-and-punctuation"
          desabilitado={salvando}
        />
        <TextField
          rotulo="Fim"
          valor={fimPromo}
          aoMudar={function (texto) {
            setFimPromo(mascararData(texto));
          }}
          placeholder="dd/mm/aaaa"
          erro={erros.fim_promo}
          ajuda="Vazio = sem data para acabar."
          teclado="numbers-and-punctuation"
          desabilitado={salvando}
        />
      </View>

      <View style={estilos.acoes}>
        <Button titulo="Salvar" aoPressionar={salvar} carregando={salvando} />
        <Button
          titulo="Cancelar"
          variante="secundario"
          desabilitado={salvando}
          aoPressionar={function () {
            router.back();
          }}
        />
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  campos: {
    marginTop: 8,
    gap: 16,
  },
  imagemBloco: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  imagem: {
    width: 120,
    height: 120,
    borderRadius: 18,
  },
  semImagem: {
    opacity: 0.4,
  },
  imagemAcoes: {
    flex: 1,
    gap: 8,
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