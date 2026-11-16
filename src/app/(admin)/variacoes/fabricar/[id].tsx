// fabricar variação (/variacoes/fabricar/3). O id é o número da variação. gasta as matérias-primas da ficha técnica e cria um lote de sabonetes.
import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { TemaContext } from '../../../../theme/TemaContext';
import type { Variacao } from '../../../../services/catalogo';
import { buscarVariacao, fabricarVariacao, type DadosFabricacao } from '../../../../services/variacoes';
import { listarFichasDaVariacao, type FichaTecnica } from '../../../../services/estoque';
import { ErroApi, mensagemDeErro } from '../../../../services/api';
import { erroDoCampo } from '../../../../utils/erros';
import { paraNumero } from '../../../../utils/formatar';
import { hoje, lerData, paraDataApi } from '../../../../utils/datas';
import { digitos, mascararData } from '../../../../utils/mascaras';
import Screen from '../../../../components/ui/Screen';
import Header from '../../../../components/ui/Header';
import TextField from '../../../../components/ui/TextField';
import Button from '../../../../components/ui/Button';
import Notice from '../../../../components/ui/Notice';
import ScreenState from '../../../../components/ui/ScreenState';
import SectionTitle from '../../../../components/ui/SectionTitle';
import ListItem from '../../../../components/ui/ListItem';

const LIMITE_QUANTIDADE = 100000;
const LIMITE_LOTE = 50;
const CAMPOS = ['quantidade', 'data_validade', 'data_fabricacao', 'numero_lote', 'observacao'];

function formatarQuantidade(valor: number) {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

export default function FabricarVariacao() {
  const { cores } = useContext(TemaContext);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [variacao, setVariacao] = useState<Variacao | null>(null);
  const [fichas, setFichas] = useState<FichaTecnica[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [falhouCarregar, setFalhouCarregar] = useState(false);
  const [quantidade, setQuantidade] = useState('');
  const [validade, setValidade] = useState('');
  const [fabricacao, setFabricacao] = useState('');
  const [numeroLote, setNumeroLote] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [faltaEstoque, setFaltaEstoque] = useState(false);
  const [fabricando, setFabricando] = useState(false);

  useEffect(function () {
    carregar();
  }, [id]);

  async function carregar() {
    setCarregando(true);
    setFalhouCarregar(false);
    try {
      const [dados, lista] = await Promise.all([buscarVariacao(Number(id)), listarFichasDaVariacao(Number(id))]);
      setVariacao(dados);
      setFichas(lista);
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar a variação.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  const quantidadeDigitada = /^\d+$/.test(quantidade.trim()) ? Number(quantidade.trim()) : 0;

  const consumo = fichas.map(function (ficha) {
    const necessario = paraNumero(ficha.quantidade_necessaria) * quantidadeDigitada;
    const saldo = paraNumero(ficha.materia_prima.quantidade_estoque);
    return {
      ficha: ficha,
      necessario: necessario,
      saldo: saldo,
      suficiente: necessario <= saldo,
    };
  });

  const tudoSuficiente = consumo.every(function (item) {
    return item.suficiente;
  });

  function montarDados(): DadosFabricacao | null {
    const novosErros: Record<string, string> = {};
    const quantidadeLimpa = quantidade.trim();
    const dataValidade = validade.trim() ? lerData(validade) : null;
    const dataFabricacao = fabricacao.trim() ? lerData(fabricacao) : null;
    const loteLimpo = numeroLote.trim();

    if (!/^\d+$/.test(quantidadeLimpa) || Number(quantidadeLimpa) < 1 || Number(quantidadeLimpa) > LIMITE_QUANTIDADE) {
      novosErros.quantidade = 'Informe uma quantidade de 1 a 100.000.';
    }
    if (!validade.trim()) {
      novosErros.data_validade = 'Informe a data de validade.';
    } else if (!dataValidade) {
      novosErros.data_validade = 'Use o formato dd/mm/aaaa.';
    } else if (dataValidade < hoje()) {
      novosErros.data_validade = 'A validade não pode estar no passado.';
    }
    if (fabricacao.trim() && !dataFabricacao) {
      novosErros.data_fabricacao = 'Use o formato dd/mm/aaaa.';
    } else if (dataFabricacao && dataValidade && dataValidade < dataFabricacao) {
      novosErros.data_validade = 'A validade precisa ser depois da fabricação.';
    }
    if (loteLimpo.length > LIMITE_LOTE) {
      novosErros.numero_lote = `Use no máximo ${LIMITE_LOTE} caracteres.`;
    }

    setErros(novosErros);
    if (Object.keys(novosErros).length > 0 || !dataValidade) {
      return null;
    }

    const dados: DadosFabricacao = {
      quantidade: Number(quantidadeLimpa),
      data_validade: paraDataApi(dataValidade),
    };
    if (dataFabricacao) {
      dados.data_fabricacao = paraDataApi(dataFabricacao);
    }
    if (loteLimpo) {
      dados.numero_lote = loteLimpo;
    }
    if (observacao.trim()) {
      dados.observacao = observacao.trim();
    }
    return dados;
  }

  async function fabricar() {
    setErroGeral('');
    setFaltaEstoque(false);
    const dados = montarDados();
    if (!dados) {
      return;
    }
    setFabricando(true);
    try {
      const lote = await fabricarVariacao(Number(id), dados);
      router.replace(`/lotes-sabonetes/${lote.id}` as Href);
    } catch (e) {
      if (e instanceof ErroApi && e.codigo === 'estoque_insuficiente') {
        setFaltaEstoque(true);
        setErroGeral(mensagemDeErro(e, 'Falta matéria-prima para essa quantidade.'));
        return;
      }
      if (e instanceof ErroApi && e.codigo === 'ficha_tecnica_inexistente') {
        setErroGeral(mensagemDeErro(e, 'Esta variação não tem ficha técnica ativa.'));
        return;
      }
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
        setErroGeral(mensagemDeErro(e, 'Não foi possível fabricar.'));
      }
    } finally {
      setFabricando(false);
    }
  }

  function irParaCompra() {
    router.push('/historico-compras/novo' as Href);
  }

  if (carregando || falhouCarregar || !variacao) {
    return (
      <Screen>
        <Header titulo="Fabricar" voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando variação…' : erroGeral}
          aoTentarNovamente={carregando ? undefined : carregar}
        />
      </Screen>
    );
  }

  const semFicha = fichas.length === 0;
  const faltaNaPrevia = quantidadeDigitada > 0 && !tudoSuficiente;

  return (
    <Screen rolavel>
      <Header titulo="Fabricar" voltar />

      <Text style={[estilos.nome, { color: cores.texto }]}>{variacao.nome}</Text>
      <Text style={[estilos.apoio, { color: cores.textoApoio }]}>
        {variacao.sku} · estoque atual {variacao.quantidade_estoque}
      </Text>

      {semFicha ? (
        <View style={estilos.secao}>
          <Notice mensagem="Esta variação não tem ficha técnica ativa. Cadastre os ingredientes antes de fabricar." tom="erro" />
          <Button
            titulo="Adicionar ingrediente"
            variante="secundario"
            icone="add"
            aoPressionar={function () {
              router.push(`/fichas-tecnicas/novo?variacao=${variacao.id}` as Href);
            }}
          />
          <Button
            titulo="Voltar"
            variante="texto"
            aoPressionar={function () {
              router.back();
            }}
          />
        </View>
      ) : (
        <>
          {erroGeral ? <Notice mensagem={erroGeral} tom="erro" /> : null}
          {faltaEstoque ? (
            <Button titulo="Registrar uma compra" variante="secundario" icone="cart-outline" aoPressionar={irParaCompra} />
          ) : null}

          <View style={estilos.campos}>
            <TextField
              rotulo="Quantidade a fabricar"
              valor={quantidade}
              aoMudar={function (texto) {
              setQuantidade(digitos(texto));
                setErros({ ...erros, quantidade: '' });
              }}
              placeholder="Ex.: 20"
              erro={erros.quantidade}
              ajuda="De 1 a 100.000 sabonetes."
              teclado="number-pad"
              desabilitado={fabricando}
            />
            <TextField
              rotulo="Validade do lote"
              valor={validade}
              aoMudar={function (texto) {
                setValidade(mascararData(texto));
              }}
              placeholder="dd/mm/aaaa"
              erro={erros.data_validade}
              ajuda="Obrigatória. Não pode estar no passado."
              teclado="numbers-and-punctuation"
              desabilitado={fabricando}
            />
            <TextField
              rotulo="Data de fabricação"
              valor={fabricacao}
              aoMudar={function (texto) {
                setFabricacao(mascararData(texto));
              }}
              placeholder="dd/mm/aaaa"
              erro={erros.data_fabricacao}
              ajuda="Opcional. Vazio = hoje."
              teclado="numbers-and-punctuation"
              desabilitado={fabricando}
            />
            <TextField
              rotulo="Número do lote"
              valor={numeroLote}
              aoMudar={setNumeroLote}
              placeholder={`${variacao.sku}-AAAAMMDD-01`}
              erro={erros.numero_lote}
              ajuda="Opcional. Vazio = o sistema gera sozinho."
              maiusculas="characters"
              desabilitado={fabricando}
            />
            <TextField
              rotulo="Observação"
              valor={observacao}
              aoMudar={setObservacao}
              placeholder="Algo importante sobre este lote"
              erro={erros.observacao}
              ajuda="Opcional."
              multilinha
              desabilitado={fabricando}
            />
          </View>

          <View style={estilos.secao}>
            <SectionTitle titulo="O que vai ser gasto" />
            {quantidadeDigitada === 0 ? (
              <Text style={[estilos.apoio, { color: cores.textoApoio }]}>Digite a quantidade para ver o consumo de cada matéria-prima.</Text>
            ) : null}
            {consumo.map(function (item) {
              const unidade = item.ficha.materia_prima.unidade_medida.toLowerCase();
              return (
                <ListItem
                  key={item.ficha.id}
                  titulo={item.ficha.materia_prima.nome}
                  subtitulo={`precisa ${formatarQuantidade(item.necessario)} ${unidade} · tem ${formatarQuantidade(item.saldo)} ${unidade}`}
                  selo={quantidadeDigitada === 0 ? undefined : item.suficiente ? { texto: 'Dá', tom: 'sucesso' } : { texto: 'Falta', tom: 'erro' }}
                />
              );
            })}
            {faltaNaPrevia ? (
              <>
                <Notice mensagem="Pela prévia, falta matéria-prima para essa quantidade. Diminua a quantidade ou registre uma compra." tom="erro" />
                <Button titulo="Registrar uma compra" variante="texto" icone="cart-outline" aoPressionar={irParaCompra} />
              </>
            ) : null}
          </View>

          <View style={estilos.acoes}>
            <Button titulo="Fabricar" icone="flask-outline" aoPressionar={fabricar} carregando={fabricando} desabilitado={faltaNaPrevia} />
            <Button
              titulo="Cancelar"
              variante="secundario"
              desabilitado={fabricando}
              aoPressionar={function () {
                router.back();
              }}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const estilos = StyleSheet.create({
  nome: {
    fontSize: 22,
    fontWeight: '700',
  },
  apoio: {
    fontSize: 14,
    marginTop: 4,
  },
  campos: {
    marginTop: 20,
    gap: 16,
  },
  secao: {
    marginTop: 24,
    gap: 10,
  },
  acoes: {
    marginTop: 28,
    marginBottom: 12,
    gap: 10,
  },
});