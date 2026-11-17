import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { criarLoteVariacao, criarMovimentacaoEstoque } from '../../../services/estoque';
import { opcoesVariacoes, type OpcaoVariacao } from '../../../services/opcoes';
import { mensagemDeErro } from '../../../services/api';
import { erroDoCampo } from '../../../utils/erros';
import { digitos, mascararData } from '../../../utils/mascaras';
import { hoje, lerData, paraDataApi } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import TextField from '../../../components/ui/TextField';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Notice from '../../../components/ui/Notice';
import ScreenState from '../../../components/ui/ScreenState';

const CAMPOS = ['variacao', 'numero_lote', 'data_fabricacao', 'data_validade', 'observacao'];

export default function NovoLoteSabonete() {
  const parametros = useLocalSearchParams<{ variacao?: string }>();

  const [variacoes, setVariacoes] = useState<OpcaoVariacao[]>([]);
  const [variacaoId, setVariacaoId] = useState<number | null>(parametros.variacao ? Number(parametros.variacao) : null);
  const [numeroLote, setNumeroLote] = useState('');
  const [fabricacao, setFabricacao] = useState('');
  const [validade, setValidade] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [loteCriado, setLoteCriado] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [falhouCarregar, setFalhouCarregar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(function () {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    setFalhouCarregar(false);
    setErroGeral('');
    try {
      setVariacoes(await opcoesVariacoes());
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar as variações.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  function validar() {
    const novosErros: Record<string, string> = {};
    if (variacaoId === null) {
      novosErros.variacao = 'Escolha a variação.';
    }
    if (numeroLote.trim().length > 50) {
      novosErros.numero_lote = 'Use no máximo 50 caracteres.';
    }
    const dataFabricacao = fabricacao ? lerData(fabricacao) : null;
    if (fabricacao && !dataFabricacao) {
      novosErros.data_fabricacao = 'Use o formato dd/mm/aaaa.';
    }
    const dataValidade = lerData(validade);
    if (!validade) {
      novosErros.data_validade = 'Informe a validade.';
    } else if (!dataValidade) {
      novosErros.data_validade = 'Use o formato dd/mm/aaaa.';
    } else if (dataValidade < hoje()) {
      novosErros.data_validade = 'A validade não pode estar no passado.';
    } else if (dataFabricacao && dataValidade < dataFabricacao) {
      novosErros.data_validade = 'A validade não pode ser antes da fabricação.';
    }
    if (quantidade && Number(quantidade) < 1) {
      novosErros.quantidade = 'Informe pelo menos 1 unidade.';
    }
    return novosErros;
  }

  async function salvar() {
    setErroGeral('');
    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0 || variacaoId === null) {
      return;
    }
    setSalvando(true);
    let idLote = loteCriado;
    try {
      if (idLote === null) {
        const dataValidade = lerData(validade) as Date;
        const dataFabricacao = fabricacao ? lerData(fabricacao) : null;
        const lote = await criarLoteVariacao({
          variacao: variacaoId,
          data_validade: paraDataApi(dataValidade),
          ...(dataFabricacao ? { data_fabricacao: paraDataApi(dataFabricacao) } : {}),
          ...(numeroLote.trim() ? { numero_lote: numeroLote.trim() } : {}),
          ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
        });
        idLote = lote.id;
        setLoteCriado(lote.id);
      }
      if (quantidade) {
        await criarMovimentacaoEstoque({
          lote_produto_variacao: idLote,
          tipo: 'ENTRADA',
          quantidade_movimentada: Number(quantidade),
        });
      }
      router.replace(`/lotes-sabonetes/${idLote}` as Href);
    } catch (e) {
      if (idLote !== null) {
        setErroGeral(`O lote foi criado, mas a entrada não foi registrada: ${mensagemDeErro(e, 'erro desconhecido.')} Corrija a quantidade e tente de novo, ou abra o lote vazio.`);
      } else {
        const errosApi: Record<string, string> = {};
        for (const campo of CAMPOS) {
          const mensagem = erroDoCampo(e, campo);
          if (mensagem) {
            errosApi[campo] = mensagem;
          }
        }
        if (Object.keys(errosApi).length > 0) {
          setErros(errosApi);
        } else {
          setErroGeral(mensagemDeErro(e, 'Não foi possível criar o lote.'));
        }
      }
    } finally {
      setSalvando(false);
    }
  }

  if (carregando || falhouCarregar) {
    return (
      <Screen>
        <Header titulo="Novo lote de sabonetes" voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando…' : erroGeral}
          aoTentarNovamente={carregando ? undefined : carregar}
        />
      </Screen>
    );
  }

  const travado = salvando || loteCriado !== null;

  return (
    <Screen rolavel>
      <Header titulo="Novo lote de sabonetes" subtitulo="Entrada avulsa, sem gastar matéria-prima" voltar />

      <Notice mensagem="Para produzir usando a ficha técnica (e descontar as matérias-primas), use Fabricar na tela da variação." tom="sucesso" />
      {erroGeral ? <Notice mensagem={erroGeral} tom="erro" /> : null}

      <View style={estilos.campos}>
        <Select
          rotulo="Variação"
          opcoes={variacoes}
          selecionados={variacaoId === null ? [] : [variacaoId]}
          aoMudar={function (valores) {
            if (!travado) {
              setVariacaoId(valores.length > 0 ? Number(valores[0]) : null);
            }
          }}
          placeholder="Escolha a variação"
          erro={erros.variacao}
        />
        <TextField
          rotulo="Número do lote (opcional)"
          valor={numeroLote}
          aoMudar={setNumeroLote}
          placeholder="Gerado sozinho se ficar vazio"
          erro={erros.numero_lote}
          maiusculas="characters"
          desabilitado={travado}
        />
        <TextField
          rotulo="Data de fabricação (opcional)"
          valor={fabricacao}
          aoMudar={function (texto) {
            setFabricacao(mascararData(texto));
          }}
          placeholder="dd/mm/aaaa"
          erro={erros.data_fabricacao}
          ajuda="Vazio usa a data de hoje."
          teclado="number-pad"
          desabilitado={travado}
        />
        <TextField
          rotulo="Validade"
          valor={validade}
          aoMudar={function (texto) {
            setValidade(mascararData(texto));
          }}
          placeholder="dd/mm/aaaa"
          erro={erros.data_validade}
          teclado="number-pad"
          desabilitado={travado}
        />
        <TextField
          rotulo="Quantidade de entrada (opcional)"
          valor={quantidade}
          aoMudar={function (texto) {
            setQuantidade(digitos(texto).slice(0, 6));
          }}
          placeholder="Ex.: 20"
          erro={erros.quantidade}
          ajuda="Se preencher, o lote já nasce com essas unidades. Se deixar vazio, fica com 0."
          sufixo="un"
          teclado="number-pad"
          desabilitado={salvando}
        />
        <TextField
          rotulo="Observação (opcional)"
          valor={observacao}
          aoMudar={setObservacao}
          placeholder="Ex.: sabonetes de brinde da feira"
          erro={erros.observacao}
          multilinha
          desabilitado={travado}
        />
      </View>

      <View style={estilos.acoes}>
        <Button titulo={loteCriado !== null ? 'Tentar a entrada de novo' : 'Criar lote'} aoPressionar={salvar} carregando={salvando} />
        {loteCriado !== null ? (
          <Button
            titulo="Abrir lote vazio"
            variante="secundario"
            aoPressionar={function () {
              router.replace(`/lotes-sabonetes/${loteCriado}` as Href);
            }}
          />
        ) : (
          <Button
            titulo="Cancelar"
            variante="secundario"
            desabilitado={salvando}
            aoPressionar={function () {
              router.back();
            }}
          />
        )}
      </View>
    </Screen>
  );
}

const estilos = StyleSheet.create({
  campos: {
    marginTop: 8,
    gap: 16,
  },
  acoes: {
    marginTop: 28,
    marginBottom: 12,
    gap: 10,
  },
});
