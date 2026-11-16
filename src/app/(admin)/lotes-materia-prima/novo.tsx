import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { criarLoteMateriaPrima, criarMovimentacaoMaterial } from '../../../services/estoque';
import { opcoesMateriasPrimas, type OpcaoMateriaPrima } from '../../../services/opcoes';
import { opcoesFornecedores } from '../../../services/compras';
import { mensagemDeErro } from '../../../services/api';
import { erroDoCampo } from '../../../utils/erros';
import { mascararData, mascararDecimal } from '../../../utils/mascaras';
import { hoje, lerData, paraDataApi } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import TextField from '../../../components/ui/TextField';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Notice from '../../../components/ui/Notice';
import ScreenState from '../../../components/ui/ScreenState';

const PADRAO_QUANTIDADE = /^\d{1,7}(\.\d{1,3})?$/;
const CAMPOS = ['materia_prima', 'numero_lote_fabricante', 'data_validade', 'observacao'];

export default function NovoLoteMateriaPrima() {
  const parametros = useLocalSearchParams<{ materia?: string }>();

  const [materias, setMaterias] = useState<OpcaoMateriaPrima[]>([]);
  const [fornecedores, setFornecedores] = useState<{ valor: number; rotulo: string }[]>([]);
  const [materiaId, setMateriaId] = useState<number | null>(parametros.materia ? Number(parametros.materia) : null);
  const [numeroLote, setNumeroLote] = useState('');
  const [validade, setValidade] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [fornecedorId, setFornecedorId] = useState<number | null>(null);
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
      const [listaMaterias, listaFornecedores] = await Promise.all([opcoesMateriasPrimas(), opcoesFornecedores()]);
      setMaterias(listaMaterias);
      setFornecedores(listaFornecedores);
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar as matérias-primas.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  const materia = materias.find(function (opcao) {
    return opcao.valor === materiaId;
  });
  const unidade = materia ? materia.unidade.toLowerCase() : undefined;

  function validar() {
    const novosErros: Record<string, string> = {};
    if (materiaId === null) {
      novosErros.materia_prima = 'Escolha a matéria-prima.';
    }
    if (numeroLote.trim().length > 50) {
      novosErros.numero_lote_fabricante = 'Use no máximo 50 caracteres.';
    }
    if (validade) {
      const data = lerData(validade);
      if (!data) {
        novosErros.data_validade = 'Use o formato dd/mm/aaaa.';
      } else if (data < hoje()) {
        novosErros.data_validade = 'A validade não pode estar no passado.';
      }
    }
    const quantidadeApi = quantidade.trim().replace(',', '.');
    if (quantidadeApi && (!PADRAO_QUANTIDADE.test(quantidadeApi) || Number(quantidadeApi) <= 0)) {
      novosErros.quantidade = 'Informe uma quantidade maior que zero, com até 3 casas.';
    }
    return novosErros;
  }

  async function salvar() {
    setErroGeral('');
    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0 || materiaId === null) {
      return;
    }
    setSalvando(true);
    let idLote = loteCriado;
    try {
      if (idLote === null) {
        const data = validade ? lerData(validade) : null;
        const lote = await criarLoteMateriaPrima({
          materia_prima: materiaId,
          ...(numeroLote.trim() ? { numero_lote_fabricante: numeroLote.trim() } : {}),
          ...(data ? { data_validade: paraDataApi(data) } : {}),
          ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
        });
        idLote = lote.id;
        setLoteCriado(lote.id);
      }
      const quantidadeApi = quantidade.trim().replace(',', '.');
      if (quantidadeApi) {
        await criarMovimentacaoMaterial({
          lote_materia_prima: idLote,
          tipo: 'ENTRADA',
          quantidade_movimentada: quantidadeApi,
          ...(fornecedorId !== null ? { fornecedor: fornecedorId } : {}),
        });
      }
      router.replace(`/lotes-materia-prima/${idLote}` as Href);
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
        <Header titulo="Novo lote" voltar />
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
      <Header titulo="Novo lote" subtitulo="Para entradas fora de uma compra, como doações ou sobras" voltar />

      <Notice mensagem="Compras de fornecedor já criam o lote sozinhas. Use esta tela só para entradas avulsas." tom="sucesso" />
      {erroGeral ? <Notice mensagem={erroGeral} tom="erro" /> : null}

      <View style={estilos.campos}>
        <Select
          rotulo="Matéria-prima"
          opcoes={materias}
          selecionados={materiaId === null ? [] : [materiaId]}
          aoMudar={function (valores) {
            if (!travado) {
              setMateriaId(valores.length > 0 ? Number(valores[0]) : null);
            }
          }}
          placeholder="Escolha a matéria-prima"
          erro={erros.materia_prima}
        />
        <TextField
          rotulo="Lote do fabricante (opcional)"
          valor={numeroLote}
          aoMudar={setNumeroLote}
          placeholder="Ex.: L2026-11"
          erro={erros.numero_lote_fabricante}
          ajuda="Vazio fica como “Não informado”."
          maiusculas="characters"
          desabilitado={travado}
        />
        <TextField
          rotulo="Validade (opcional)"
          valor={validade}
          aoMudar={function (texto) {
            setValidade(mascararData(texto));
          }}
          placeholder="dd/mm/aaaa"
          erro={erros.data_validade}
          ajuda="Lote sem validade nunca vence."
          teclado="number-pad"
          desabilitado={travado}
        />
        <TextField
          rotulo="Quantidade de entrada (opcional)"
          valor={quantidade}
          aoMudar={function (texto) {
            setQuantidade(mascararDecimal(texto, 3));
          }}
          placeholder="Ex.: 500"
          erro={erros.quantidade}
          ajuda="Se preencher, o lote já nasce abastecido. Se deixar vazio, ele fica com 0."
          sufixo={unidade}
          teclado="decimal-pad"
          desabilitado={salvando}
        />
        {quantidade ? (
          <Select
            rotulo="Fornecedor (opcional)"
            opcoes={fornecedores}
            selecionados={fornecedorId === null ? [] : [fornecedorId]}
            aoMudar={function (valores) {
              setFornecedorId(valores.length > 0 ? Number(valores[0]) : null);
            }}
            placeholder="De quem veio esta entrada"
          />
        ) : null}
        <TextField
          rotulo="Observação (opcional)"
          valor={observacao}
          aoMudar={setObservacao}
          placeholder="Ex.: sobra da produção de outubro"
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
              router.replace(`/lotes-materia-prima/${loteCriado}` as Href);
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
