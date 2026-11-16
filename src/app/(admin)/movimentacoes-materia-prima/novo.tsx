import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { TemaContext } from '../../../theme/TemaContext';
import { buscarLoteMateriaPrima, criarMovimentacaoMaterial, listarLotesMateriaPrima, formatarQuantidade, SITUACOES_LOTE, TIPOS_MANUAIS, type LoteMateriaPrima } from '../../../services/estoque';
import { opcoesMateriasPrimas, type OpcaoMateriaPrima } from '../../../services/opcoes';
import { opcoesFornecedores } from '../../../services/compras';
import { mensagemDeErro } from '../../../services/api';
import { erroDoCampo } from '../../../utils/erros';
import { mascararDecimal } from '../../../utils/mascaras';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import TextField from '../../../components/ui/TextField';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Notice from '../../../components/ui/Notice';
import ScreenState from '../../../components/ui/ScreenState';

type TipoManual = 'ENTRADA' | 'AJUSTE_OU_PERDA';

const PADRAO_QUANTIDADE = /^\d{1,7}(\.\d{1,3})?$/;
const CAMPOS = ['lote_materia_prima', 'tipo', 'quantidade_movimentada', 'fornecedor', 'observacao'];

export default function NovaMovimentacaoMateriaPrima() {
  const { cores } = useContext(TemaContext);
  const parametros = useLocalSearchParams<{ lote?: string }>();

  const [materias, setMaterias] = useState<OpcaoMateriaPrima[]>([]);
  const [fornecedores, setFornecedores] = useState<{ valor: number; rotulo: string }[]>([]);
  const [lotes, setLotes] = useState<LoteMateriaPrima[]>([]);
  const [materiaId, setMateriaId] = useState<number | null>(null);
  const [loteId, setLoteId] = useState<number | null>(parametros.lote ? Number(parametros.lote) : null);
  const [tipo, setTipo] = useState<TipoManual>('ENTRADA');
  const [quantidade, setQuantidade] = useState('');
  const [fornecedorId, setFornecedorId] = useState<number | null>(null);
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
      const [listaMaterias, listaFornecedores] = await Promise.all([opcoesMateriasPrimas(), opcoesFornecedores()]);
      setMaterias(listaMaterias);
      setFornecedores(listaFornecedores);
      if (parametros.lote) {
        const lote = await buscarLoteMateriaPrima(Number(parametros.lote));
        setMateriaId(lote.materia_prima);
        await carregarLotes(lote.materia_prima);
      }
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar os dados.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarLotes(idMateria: number) {
    try {
      const resposta = await listarLotesMateriaPrima({ pagina: 1, materiaPrimaId: idMateria });
      setLotes(resposta.results);
    } catch (e) {
      setLotes([]);
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar os lotes.'));
    }
  }

  function escolherMateria(idMateria: number | null) {
    setMateriaId(idMateria);
    setLoteId(null);
    setLotes([]);
    if (idMateria !== null) {
      carregarLotes(idMateria);
    }
  }

  const materia = materias.find(function (opcao) {
    return opcao.valor === materiaId;
  });
  const unidade = materia ? materia.unidade.toLowerCase() : '';
  const loteEscolhido = lotes.find(function (lote) {
    return lote.id === loteId;
  });
  const opcoesLotes = lotes.map(function (lote) {
    return {
      valor: lote.id,
      rotulo: `${lote.numero_lote_fabricante || `Lote #${lote.id}`} · saldo ${formatarQuantidade(lote.quantidade_atual)} ${unidade} · ${SITUACOES_LOTE[lote.status].texto.toLowerCase()}`,
    };
  });

  async function salvar() {
    setErroGeral('');
    const novosErros: Record<string, string> = {};
    const quantidadeApi = quantidade.trim().replace(',', '.');
    if (materiaId === null) {
      novosErros.materia = 'Escolha a matéria-prima.';
    }
    if (loteId === null) {
      novosErros.lote_materia_prima = 'Escolha o lote.';
    }
    if (!PADRAO_QUANTIDADE.test(quantidadeApi) || Number(quantidadeApi) <= 0) {
      novosErros.quantidade_movimentada = 'Informe uma quantidade maior que zero, com até 3 casas.';
    } else if (tipo === 'AJUSTE_OU_PERDA' && loteEscolhido && Number(quantidadeApi) > Number(loteEscolhido.quantidade_atual)) {
      novosErros.quantidade_movimentada = `O lote só tem ${formatarQuantidade(loteEscolhido.quantidade_atual)} ${unidade}.`;
    }
    if (tipo === 'ENTRADA' && loteEscolhido && loteEscolhido.status === 'VENCIDO') {
      novosErros.lote_materia_prima = 'Lote vencido não aceita entrada.';
    }
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0 || loteId === null) {
      return;
    }
    setSalvando(true);
    try {
      await criarMovimentacaoMaterial({
        lote_materia_prima: loteId,
        tipo: tipo,
        quantidade_movimentada: quantidadeApi,
        ...(fornecedorId !== null ? { fornecedor: fornecedorId } : {}),
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
      <Header titulo="Nova movimentação" subtitulo="Matéria-prima" voltar />

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
          rotulo="Matéria-prima"
          opcoes={materias}
          selecionados={materiaId === null ? [] : [materiaId]}
          aoMudar={function (valores) {
            escolherMateria(valores.length > 0 ? Number(valores[0]) : null);
          }}
          placeholder="Escolha a matéria-prima"
          erro={erros.materia}
        />
        {materiaId !== null ? (
          lotes.length > 0 ? (
            <Select
              rotulo="Lote"
              opcoes={opcoesLotes}
              selecionados={loteId === null ? [] : [loteId]}
              aoMudar={function (valores) {
                setLoteId(valores.length > 0 ? Number(valores[0]) : null);
              }}
              placeholder="Escolha o lote"
              erro={erros.lote_materia_prima}
            />
          ) : (
            <Text style={[estilos.aviso, { color: cores.textoApoio }]}>Esta matéria-prima ainda não tem lotes. Registre uma compra ou crie um lote antes.</Text>
          )
        ) : null}
        <TextField
          rotulo="Quantidade"
          valor={quantidade}
          aoMudar={function (texto) {
            setQuantidade(mascararDecimal(texto, 3));
          }}
          placeholder="Ex.: 250"
          erro={erros.quantidade_movimentada}
          ajuda={tipo === 'ENTRADA' ? 'Soma ao saldo do lote.' : 'Tira do saldo do lote (quebra, vazamento, contagem errada).'}
          sufixo={unidade || undefined}
          teclado="decimal-pad"
          desabilitado={salvando}
        />
        <Select
          rotulo="Fornecedor (opcional)"
          opcoes={fornecedores}
          selecionados={fornecedorId === null ? [] : [fornecedorId]}
          aoMudar={function (valores) {
            setFornecedorId(valores.length > 0 ? Number(valores[0]) : null);
          }}
          placeholder="Se envolveu algum fornecedor"
          erro={erros.fornecedor}
        />
        <TextField
          rotulo="Observação (opcional)"
          valor={observacao}
          aoMudar={setObservacao}
          placeholder="Ex.: frasco quebrou na prateleira"
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
