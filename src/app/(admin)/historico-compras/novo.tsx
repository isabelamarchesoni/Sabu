import { useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { TemaContext } from '../../../theme/TemaContext';
import { criarCompra, opcoesFornecedores, type DadosItemCompra } from '../../../services/compras';
import { opcoesMateriasPrimas, type OpcaoMateriaPrima } from '../../../services/opcoes';
import { formatarCusto } from '../../../services/estoque';
import { ErroApi, mensagemDeErro } from '../../../services/api';
import { erroDoCampo } from '../../../utils/erros';
import { mascararData, mascararDecimal } from '../../../utils/mascaras';
import { hoje, lerData, paraDataApi } from '../../../utils/datas';
import Screen from '../../../components/ui/Screen';
import Header from '../../../components/ui/Header';
import SectionTitle from '../../../components/ui/SectionTitle';
import TextField from '../../../components/ui/TextField';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import Notice from '../../../components/ui/Notice';
import ScreenState from '../../../components/ui/ScreenState';

type LinhaItem = {
  chave: number;
  materiaId: number | null;
  quantidade: string;
  custo: string;
  lote: string;
  validade: string;
};

const PADRAO_QUANTIDADE = /^\d{1,7}(\.\d{1,3})?$/;
const PADRAO_CUSTO = /^\d{1,6}(\.\d{1,4})?$/;
const CAMPOS_ITEM = ['materia_prima', 'quantidade_item', 'custo_unitario_momento_compra', 'numero_lote_fabricante', 'data_validade'];

function linhaVazia(chave: number): LinhaItem {
  return { chave: chave, materiaId: null, quantidade: '', custo: '', lote: '', validade: '' };
}

function paraApi(texto: string) {
  return texto.trim().replace(',', '.');
}

function errosDosItensDaApi(erro: unknown) {
  if (!(erro instanceof ErroApi) || !erro.erros || typeof erro.erros !== 'object') {
    return [];
  }
  const itens = (erro.erros as Record<string, unknown>).itens;
  if (!Array.isArray(itens)) {
    return [];
  }
  return itens.map(function (item) {
    const resultado: Record<string, string> = {};
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      for (const campo of CAMPOS_ITEM) {
        const mensagens = (item as Record<string, unknown>)[campo];
        if (Array.isArray(mensagens) && mensagens.length > 0) {
          resultado[campo] = String(mensagens[0]);
        }
      }
    }
    return resultado;
  });
}

export default function NovaCompra() {
  const { cores } = useContext(TemaContext);
  const parametros = useLocalSearchParams<{ fornecedor?: string }>();
  const proximaChave = useRef(2);

  const [fornecedores, setFornecedores] = useState<{ valor: number; rotulo: string }[]>([]);
  const [materias, setMaterias] = useState<OpcaoMateriaPrima[]>([]);
  const [fornecedorId, setFornecedorId] = useState<number | null>(parametros.fornecedor ? Number(parametros.fornecedor) : null);
  const [observacao, setObservacao] = useState('');
  const [itens, setItens] = useState<LinhaItem[]>([linhaVazia(1)]);
  const [erroFornecedor, setErroFornecedor] = useState('');
  const [errosItens, setErrosItens] = useState<Record<number, Record<string, string>>>({});
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
      const [listaFornecedores, listaMaterias] = await Promise.all([opcoesFornecedores(), opcoesMateriasPrimas()]);
      setFornecedores(listaFornecedores);
      setMaterias(listaMaterias);
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar fornecedores e matérias-primas.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  function materiaPorId(materiaId: number | null) {
    return materias.find(function (opcao) {
      return opcao.valor === materiaId;
    });
  }

  function mudarItem(chave: number, mudancas: Partial<LinhaItem>) {
    setItens(
      itens.map(function (item) {
        return item.chave === chave ? { ...item, ...mudancas } : item;
      })
    );
  }

  function escolherMateria(chave: number, materiaId: number | null) {
    const item = itens.find(function (linha) {
      return linha.chave === chave;
    });
    const materia = materiaPorId(materiaId);
    const mudancas: Partial<LinhaItem> = { materiaId: materiaId };
    if (item && !item.custo && materia) {
      mudancas.custo = materia.custo.replace('.', ',');
    }
    mudarItem(chave, mudancas);
  }

  function adicionarItem() {
    setItens([...itens, linhaVazia(proximaChave.current)]);
    proximaChave.current += 1;
  }

  function removerItem(chave: number) {
    setItens(
      itens.filter(function (item) {
        return item.chave !== chave;
      })
    );
  }

  const total = itens.reduce(function (soma, item) {
    const quantidade = Number(paraApi(item.quantidade));
    const custo = Number(paraApi(item.custo));
    return Number.isNaN(quantidade) || Number.isNaN(custo) ? soma : soma + quantidade * custo;
  }, 0);

  function validar() {
    let valido = true;
    setErroFornecedor('');
    if (fornecedorId === null) {
      setErroFornecedor('Escolha o fornecedor.');
      valido = false;
    }
    const novosErros: Record<number, Record<string, string>> = {};
    const usadas = new Set<number>();
    itens.forEach(function (item) {
      const errosItem: Record<string, string> = {};
      if (item.materiaId === null) {
        errosItem.materia_prima = 'Escolha a matéria-prima.';
      } else if (usadas.has(item.materiaId)) {
        errosItem.materia_prima = 'Esta matéria-prima já está em outro item.';
      } else {
        usadas.add(item.materiaId);
      }
      const quantidade = paraApi(item.quantidade);
      if (!PADRAO_QUANTIDADE.test(quantidade) || Number(quantidade) <= 0) {
        errosItem.quantidade_item = 'Informe uma quantidade maior que zero.';
      }
      if (!PADRAO_CUSTO.test(paraApi(item.custo))) {
        errosItem.custo_unitario_momento_compra = 'Informe o custo, ex.: 0,0450.';
      }
      if (item.lote.trim().length > 50) {
        errosItem.numero_lote_fabricante = 'Use no máximo 50 caracteres.';
      }
      if (item.validade) {
        const data = lerData(item.validade);
        if (!data) {
          errosItem.data_validade = 'Use o formato dd/mm/aaaa.';
        } else if (data < hoje()) {
          errosItem.data_validade = 'A validade não pode estar no passado.';
        }
      }
      if (Object.keys(errosItem).length > 0) {
        novosErros[item.chave] = errosItem;
        valido = false;
      }
    });
    setErrosItens(novosErros);
    return valido;
  }

  function montarItens(): DadosItemCompra[] {
    return itens.map(function (item) {
      const dados: DadosItemCompra = {
        materia_prima: item.materiaId as number,
        quantidade_item: paraApi(item.quantidade),
        custo_unitario_momento_compra: paraApi(item.custo),
      };
      if (item.lote.trim()) {
        dados.numero_lote_fabricante = item.lote.trim();
      }
      const data = item.validade ? lerData(item.validade) : null;
      if (data) {
        dados.data_validade = paraDataApi(data);
      }
      return dados;
    });
  }

  async function salvar() {
    setErroGeral('');
    if (itens.length === 0) {
      setErroGeral('Adicione pelo menos um item.');
      return;
    }
    if (!validar() || fornecedorId === null) {
      return;
    }
    setSalvando(true);
    try {
      const salva = await criarCompra({
        fornecedor: fornecedorId,
        itens: montarItens(),
        ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
      });
      router.replace(`/historico-compras/${salva.id}` as Href);
    } catch (e) {
      const porIndice = errosDosItensDaApi(e);
      const errosApi: Record<number, Record<string, string>> = {};
      porIndice.forEach(function (errosItem, indice) {
        if (itens[indice] && Object.keys(errosItem).length > 0) {
          errosApi[itens[indice].chave] = errosItem;
        }
      });
      setErrosItens(errosApi);
      const doFornecedor = erroDoCampo(e, 'fornecedor');
      if (doFornecedor) {
        setErroFornecedor(doFornecedor);
      }
      const geral = erroDoCampo(e, 'itens') ?? erroDoCampo(e, 'non_field_errors');
      if (geral) {
        setErroGeral(geral);
      } else if (Object.keys(errosApi).length === 0 && !doFornecedor) {
        setErroGeral(mensagemDeErro(e, 'Não foi possível registrar a compra.'));
      }
    } finally {
      setSalvando(false);
    }
  }

  if (carregando || falhouCarregar) {
    return (
      <Screen>
        <Header titulo="Nova compra" voltar />
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
      <Header titulo="Nova compra" subtitulo="Cada item vira um lote e entra no estoque" voltar />

      {erroGeral ? <Notice mensagem={erroGeral} tom="erro" /> : null}

      <View style={estilos.campos}>
        <Select
          rotulo="Fornecedor"
          opcoes={fornecedores}
          selecionados={fornecedorId === null ? [] : [fornecedorId]}
          aoMudar={function (valores) {
            setFornecedorId(valores.length > 0 ? Number(valores[0]) : null);
          }}
          placeholder="Escolha o fornecedor"
          erro={erroFornecedor}
        />
        {fornecedores.length === 0 ? <Notice mensagem="Cadastre um fornecedor antes de registrar compras." tom="erro" /> : null}
      </View>

      <View style={estilos.secao}>
        <SectionTitle titulo="Itens" />
        {itens.map(function (item, indice) {
          const materia = materiaPorId(item.materiaId);
          const unidade = materia ? materia.unidade.toLowerCase() : undefined;
          const errosItem = errosItens[item.chave] ?? {};
          return (
            <View key={item.chave} style={[estilos.item, { backgroundColor: cores.cartao, borderColor: cores.borda }]}>
              <Select
                rotulo={`Matéria-prima ${indice + 1}`}
                opcoes={materias}
                selecionados={item.materiaId === null ? [] : [item.materiaId]}
                aoMudar={function (valores) {
                  escolherMateria(item.chave, valores.length > 0 ? Number(valores[0]) : null);
                }}
                placeholder="Escolha a matéria-prima"
                erro={errosItem.materia_prima}
              />
              <TextField
                rotulo="Quantidade"
                valor={item.quantidade}
                aoMudar={function (texto) {
                  mudarItem(item.chave, { quantidade: mascararDecimal(texto, 3) });
                }}
                placeholder="Ex.: 1000"
                erro={errosItem.quantidade_item}
                sufixo={unidade}
                teclado="decimal-pad"
                desabilitado={salvando}
              />
              <TextField
                rotulo="Custo unitário (R$)"
                valor={item.custo}
                aoMudar={function (texto) {
                  mudarItem(item.chave, { custo: mascararDecimal(texto, 4) });
                }}
                placeholder="0,0450"
                erro={errosItem.custo_unitario_momento_compra}
                ajuda={unidade ? `Preço por ${unidade}. Já vem com o custo de referência.` : 'Preço por unidade de medida.'}
                teclado="decimal-pad"
                desabilitado={salvando}
              />
              <TextField
                rotulo="Lote do fabricante (opcional)"
                valor={item.lote}
                aoMudar={function (texto) {
                  mudarItem(item.chave, { lote: texto });
                }}
                placeholder="Ex.: L2026-11"
                erro={errosItem.numero_lote_fabricante}
                maiusculas="characters"
                desabilitado={salvando}
              />
              <TextField
                rotulo="Validade (opcional)"
                valor={item.validade}
                aoMudar={function (texto) {
                  mudarItem(item.chave, { validade: mascararData(texto) });
                }}
                placeholder="dd/mm/aaaa"
                erro={errosItem.data_validade}
                teclado="number-pad"
                desabilitado={salvando}
              />
              {itens.length > 1 ? (
                <Button
                  titulo="Remover item"
                  variante="textoPerigo"
                  icone="trash-outline"
                  aoPressionar={function () {
                    removerItem(item.chave);
                  }}
                />
              ) : null}
            </View>
          );
        })}
        <Button titulo="Adicionar item" variante="secundario" icone="add" aoPressionar={adicionarItem} />
      </View>

      <View style={estilos.secao}>
        <TextField
          rotulo="Observação (opcional)"
          valor={observacao}
          aoMudar={setObservacao}
          placeholder="Ex.: frete grátis nesta compra"
          multilinha
          desabilitado={salvando}
        />
      </View>

      <View style={[estilos.resumo, { borderColor: cores.borda }]}>
        <Text style={[estilos.resumoRotulo, { color: cores.textoApoio }]}>Total estimado</Text>
        <Text style={[estilos.resumoValor, { color: cores.texto }]}>{formatarCusto(total)}</Text>
      </View>

      <View style={estilos.acoes}>
        <Button titulo="Registrar compra" aoPressionar={salvar} carregando={salvando} />
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
  secao: {
    marginTop: 24,
    gap: 12,
  },
  item: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  resumo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  resumoRotulo: {
    fontSize: 15,
  },
  resumoValor: {
    fontSize: 20,
    fontWeight: '700',
  },
  acoes: {
    marginTop: 24,
    marginBottom: 12,
    gap: 10,
  },
});
