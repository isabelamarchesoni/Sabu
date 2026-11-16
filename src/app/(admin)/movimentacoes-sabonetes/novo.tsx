import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TemaContext } from '../../../theme/TemaContext';
import { buscarLoteVariacao, criarMovimentacaoEstoque, listarLotesVariacao, SITUACOES_LOTE, TIPOS_MANUAIS, type LoteVariacao } from '../../../services/estoque';
import { opcoesVariacoes, type OpcaoVariacao } from '../../../services/opcoes';
import { mensagemDeErro } from '../../../services/api';
import { erroDoCampo } from '../../../utils/erros';
import { digitos } from '../../../utils/mascaras';
import { formatarData } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import TextField from '../../../components/ui/TextField';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Notice from '../../../components/ui/Notice';
import ScreenState from '../../../components/ui/ScreenState';

type TipoManual = 'ENTRADA' | 'AJUSTE_OU_PERDA';

const CAMPOS = ['lote_produto_variacao', 'tipo', 'quantidade_movimentada', 'observacao'];

export default function NovaMovimentacaoSabonete() {
  const { cores } = useContext(TemaContext);
  const parametros = useLocalSearchParams<{ lote?: string; variacao?: string }>();

  const [variacoes, setVariacoes] = useState<OpcaoVariacao[]>([]);
  const [lotes, setLotes] = useState<LoteVariacao[]>([]);
  const [variacaoId, setVariacaoId] = useState<number | null>(null);
  const [loteId, setLoteId] = useState<number | null>(parametros.lote ? Number(parametros.lote) : null);
  const [tipo, setTipo] = useState<TipoManual>('ENTRADA');
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
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
      let inicial: number | null = parametros.variacao ? Number(parametros.variacao) : null;
      if (parametros.lote) {
        const lote = await buscarLoteVariacao(Number(parametros.lote));
        inicial = lote.variacao;
      }
      if (inicial !== null) {
        setVariacaoId(inicial);
        await carregarLotes(inicial);
      }
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar os dados.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarLotes(idVariacao: number) {
    try {
      const resposta = await listarLotesVariacao({ pagina: 1, variacaoId: idVariacao });
      setLotes(resposta.results);
    } catch (e) {
      setLotes([]);
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar os lotes.'));
    }
  }

  function escolherVariacao(idVariacao: number | null) {
    setVariacaoId(idVariacao);
    setLoteId(null);
    setLotes([]);
    if (idVariacao !== null) {
      carregarLotes(idVariacao);
    }
  }

  const loteEscolhido = lotes.find(function (lote) {
    return lote.id === loteId;
  });
  const opcoesLotes = lotes.map(function (lote) {
    return {
      valor: lote.id,
      rotulo: `${lote.numero_lote} · saldo ${lote.quantidade_atual} · vence ${formatarData(lote.data_validade)} · ${SITUACOES_LOTE[lote.status].texto.toLowerCase()}`,
    };
  });

  async function salvar() {
    setErroGeral('');
    const novosErros: Record<string, string> = {};
    const numero = Number(quantidade);
    if (variacaoId === null) {
      novosErros.variacao = 'Escolha a variação.';
    }
    if (loteId === null) {
      novosErros.lote_produto_variacao = 'Escolha o lote.';
    }
    if (!quantidade || numero < 1) {
      novosErros.quantidade_movimentada = 'Informe pelo menos 1 unidade.';
    } else if (tipo === 'AJUSTE_OU_PERDA' && loteEscolhido && numero > loteEscolhido.quantidade_atual) {
      novosErros.quantidade_movimentada = `O lote só tem ${loteEscolhido.quantidade_atual} ${loteEscolhido.quantidade_atual === 1 ? 'unidade' : 'unidades'}.`;
    }
    if (tipo === 'ENTRADA' && loteEscolhido && loteEscolhido.status === 'VENCIDO') {
      novosErros.lote_produto_variacao = 'Lote vencido não aceita entrada.';
    }
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0 || loteId === null) {
      return;
    }
    setSalvando(true);
    try {
      await criarMovimentacaoEstoque({
        lote_produto_variacao: loteId,
        tipo: tipo,
        quantidade_movimentada: numero,
        ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
      });
      router.back();
    } catch (e) {
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
        setErroGeral(mensagemDeErro(e, 'Não foi possível registrar a movimentação.'));
      }
    } finally {
      setSalvando(false);
    }
  }

  if (carregando || falhouCarregar) {
    return (
      <Screen>
        <Header titulo="Nova movimentação" voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando…' : erroGeral}
          aoTentarNovamente={carregando ? undefined : carregar}
        />
      </Screen>
    );
  }

  return (
    <Screen rolavel>
      <Header titulo="Nova movimentação" subtitulo="Sabonetes" voltar />

      <Notice mensagem="Vendas e estornos entram sozinhos pelos pedidos. Aqui só entradas avulsas e ajustes." tom="sucesso" />
      {erroGeral ? <Notice mensagem={erroGeral} tom="erro" /> : null}

      <View style={estilos.campos}>
        <Select
          rotulo="Tipo"
          opcoes={TIPOS_MANUAIS}
          selecionados={[tipo]}
          aoMudar={function (valores) {
            if (valores.length > 0) {
              setTipo(valores[0] as TipoManual);
            }
          }}
          erro={erros.tipo}
        />
        <Select
          rotulo="Variação"
          opcoes={variacoes}
          selecionados={variacaoId === null ? [] : [variacaoId]}
          aoMudar={function (valores) {
            escolherVariacao(valores.length > 0 ? Number(valores[0]) : null);
          }}
          placeholder="Escolha a variação"
          erro={erros.variacao}
        />
        {variacaoId !== null ? (
          lotes.length > 0 ? (
            <Select
              rotulo="Lote"
              opcoes={opcoesLotes}
              selecionados={loteId === null ? [] : [loteId]}
              aoMudar={function (valores) {
                setLoteId(valores.length > 0 ? Number(valores[0]) : null);
              }}
              placeholder="Escolha o lote"
              erro={erros.lote_produto_variacao}
            />
          ) : (
            <Text style={[estilos.aviso, { color: cores.textoApoio }]}>Esta variação ainda não tem lotes. Fabrique ou crie um lote antes.</Text>
          )
        ) : null}
        <TextField
          rotulo="Quantidade"
          valor={quantidade}
          aoMudar={function (texto) {
            setQuantidade(digitos(texto).slice(0, 6));
          }}
          placeholder="Ex.: 2"
          erro={erros.quantidade_movimentada}
          ajuda={tipo === 'ENTRADA' ? 'Soma ao saldo do lote.' : 'Tira do saldo do lote (quebra, amostra, contagem errada).'}
          sufixo="un"
          teclado="number-pad"
          desabilitado={salvando}
        />
        <TextField
          rotulo="Observação (opcional)"
          valor={observacao}
          aoMudar={setObservacao}
          placeholder="Ex.: 2 sabonetes quebraram no transporte"
          erro={erros.observacao}
          multilinha
          desabilitado={salvando}
        />
      </View>

      <View style={estilos.acoes}>
        <Button titulo="Registrar movimentação" aoPressionar={salvar} carregando={salvando} />
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
  aviso: {
    fontSize: 14,
  },
  acoes: {
    marginTop: 28,
    marginBottom: 12,
    gap: 10,
  },
});
