// Formulário de vínculo fornecedor ↔ matéria-prima. /vinculos/novo cria (aceita ?materia=ID e ?fornecedor=ID); /vinculos/3 edita, apaga ou restaura o vínculo de id 3.
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { buscarVinculo, criarVinculo, atualizarVinculo, apagarVinculo, restaurarVinculo, opcoesFornecedores, type Vinculo } from '../../../services/compras';
import { opcoesMateriasPrimas, type OpcaoMateriaPrima } from '../../../services/opcoes';
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
import ConfirmModal from '../../../components/ui/ConfirmModal';

const PADRAO_CUSTO = /^\d{1,6}(\.\d{1,4})?$/;
const CAMPOS = ['fornecedor', 'materia_prima', 'custo_unitario_fornecedor', 'sku_materia_prima_fornecedor'];

export default function FormularioVinculo() {
  const { id, materia, fornecedor } = useLocalSearchParams<{ id: string; materia?: string; fornecedor?: string }>();
  const criando = id === 'novo';

  const [materias, setMaterias] = useState<OpcaoMateriaPrima[]>([]);
  const [fornecedores, setFornecedores] = useState<{ valor: number; rotulo: string }[]>([]);
  const [fornecedorId, setFornecedorId] = useState<number | null>(fornecedor ? Number(fornecedor) : null);
  const [materiaId, setMateriaId] = useState<number | null>(materia ? Number(materia) : null);
  const [custo, setCusto] = useState('');
  const [codigo, setCodigo] = useState('');
  const [vinculo, setVinculo] = useState<Vinculo | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [falhouCarregar, setFalhouCarregar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  useEffect(
    function () {
      carregar();
    },
    [id]
  );

  async function carregar() {
    setCarregando(true);
    setFalhouCarregar(false);
    setErroGeral('');
    try {
      const [listaMaterias, listaFornecedores] = await Promise.all([opcoesMateriasPrimas(), opcoesFornecedores()]);
      setMaterias(listaMaterias);
      setFornecedores(listaFornecedores);
      if (!criando) {
        const dados = await buscarVinculo(Number(id));
        setVinculo(dados);
        setFornecedorId(dados.fornecedor);
        setMateriaId(dados.materia_prima.id);
        setCusto(dados.custo_unitario_fornecedor.replace('.', ','));
        setCodigo(dados.sku_materia_prima_fornecedor ?? '');
      }
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar o vínculo.'));
      setFalhouCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  const materiaEscolhida = materias.find(function (opcao) {
    return opcao.valor === materiaId;
  });
  const unidade = materiaEscolhida ? materiaEscolhida.unidade.toLowerCase() : vinculo ? vinculo.materia_prima.unidade_medida.toLowerCase() : '';

  function escolherMateria(valor: number | null) {
    setMateriaId(valor);
    const escolhida = materias.find(function (opcao) {
      return opcao.valor === valor;
    });
    if (escolhida && !custo) {
      setCusto(escolhida.custo.replace('.', ','));
    }
  }

  async function salvar() {
    setErroGeral('');
    setAviso('');
    const novosErros: Record<string, string> = {};
    const custoApi = custo.trim().replace(',', '.');
    if (fornecedorId === null) {
      novosErros.fornecedor = 'Escolha o fornecedor.';
    }
    if (materiaId === null) {
      novosErros.materia_prima = 'Escolha a matéria-prima.';
    }
    if (!PADRAO_CUSTO.test(custoApi)) {
      novosErros.custo_unitario_fornecedor = 'Informe um custo válido, ex.: 0,0450.';
    }
    if (codigo.trim().length > 50) {
      novosErros.sku_materia_prima_fornecedor = 'Use no máximo 50 caracteres.';
    }
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0 || fornecedorId === null || materiaId === null) {
      return;
    }
    setSalvando(true);
    try {
      if (criando) {
        await criarVinculo({
          fornecedor: fornecedorId,
          materia_prima: materiaId,
          custo_unitario_fornecedor: custoApi,
          ...(codigo.trim() ? { sku_materia_prima_fornecedor: codigo.trim() } : {}),
        });
      } else {
        await atualizarVinculo(Number(id), { fornecedor: fornecedorId, custo_unitario_fornecedor: custoApi, sku_materia_prima_fornecedor: codigo.trim() });
      }
      router.back();
    } catch (e) {
      const errosApi: Record<string, string> = {};
      for (const campo of CAMPOS) {
        const mensagem = erroDoCampo(e, campo);
        if (mensagem) {
          errosApi[campo] = mensagem;
        }
      }
      const geral = erroDoCampo(e, 'non_field_errors');
      if (Object.keys(errosApi).length > 0) {
        setErros(errosApi);
      }
      if (geral) {
        setErroGeral(geral);
      } else if (Object.keys(errosApi).length === 0) {
        setErroGeral(mensagemDeErro(e, 'Não foi possível salvar o vínculo.'));
      }
    } finally {
      setSalvando(false);
    }
  }

  async function apagar() {
    setSalvando(true);
    try {
      await apagarVinculo(Number(id));
      setConfirmandoExclusao(false);
      setAviso('Vínculo apagado.');
      await carregar();
    } catch (e) {
      setConfirmandoExclusao(false);
      setErroGeral(mensagemDeErro(e, 'Não foi possível apagar o vínculo.'));
    } finally {
      setSalvando(false);
    }
  }

  async function restaurar() {
    setSalvando(true);
    try {
      await restaurarVinculo(Number(id));
      setAviso('Vínculo restaurado.');
      await carregar();
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível restaurar o vínculo. A matéria-prima e o fornecedor precisam estar ativos.'));
    } finally {
      setSalvando(false);
    }
  }

  const titulo = criando ? 'Novo vínculo' : 'Editar vínculo';

  if (carregando || falhouCarregar) {
    return (
      <Screen>
        <Header titulo={titulo} voltar />
        <ScreenState
          tipo={carregando ? 'carregando' : 'erro'}
          mensagem={carregando ? 'Carregando vínculo…' : erroGeral}
          aoTentarNovamente={carregando ? undefined : carregar}
        />
      </Screen>
    );
  }

  const apagado = vinculo !== null && vinculo.apagado_em !== null;

  return (
    <Screen rolavel>
      <Header titulo={titulo} subtitulo="Quanto este fornecedor cobra por esta matéria-prima" voltar />

      {apagado ? <Notice mensagem="Este vínculo está apagado. Restaure para editar." tom="erro" /> : null}
      {aviso ? <Notice mensagem={aviso} tom="sucesso" /> : null}
      {erroGeral ? <Notice mensagem={erroGeral} tom="erro" /> : null}

      <View style={estilos.campos}>
        <Select
          rotulo="Fornecedor"
          opcoes={fornecedores}
          selecionados={fornecedorId === null ? [] : [fornecedorId]}
          aoMudar={function (valores) {
            if (!apagado) {
              setFornecedorId(valores.length > 0 ? Number(valores[0]) : null);
            }
          }}
          placeholder="Escolha o fornecedor"
          erro={erros.fornecedor}
        />
        {criando ? (
          <Select
            rotulo="Matéria-prima"
            opcoes={materias}
            selecionados={materiaId === null ? [] : [materiaId]}
            aoMudar={function (valores) {
              escolherMateria(valores.length > 0 ? Number(valores[0]) : null);
            }}
            placeholder="Escolha a matéria-prima"
            erro={erros.materia_prima}
          />
        ) : (
          <TextField
            rotulo="Matéria-prima"
            valor={vinculo ? `${vinculo.materia_prima.nome} · ${vinculo.materia_prima.sku}` : ''}
            aoMudar={function () {}}
            ajuda="A matéria-prima não muda depois de criado."
            desabilitado
          />
        )}
        <TextField
          rotulo="Custo deste fornecedor (R$)"
          valor={custo}
          aoMudar={function (texto) {
            setCusto(mascararDecimal(texto, 4));
          }}
          placeholder="0,0450"
          erro={erros.custo_unitario_fornecedor}
          ajuda={unidade ? `Preço por ${unidade}. Até 4 casas decimais.` : 'Até 4 casas decimais.'}
          teclado="decimal-pad"
          desabilitado={salvando || apagado}
        />
        <TextField
          rotulo="Código no fornecedor (opcional)"
          valor={codigo}
          aoMudar={setCodigo}
          placeholder="Ex.: 7891234"
          erro={erros.sku_materia_prima_fornecedor}
          ajuda="Como o fornecedor chama este item no catálogo dele."
          maiusculas="characters"
          desabilitado={salvando || apagado}
        />
      </View>

      <View style={estilos.acoes}>
        {!apagado ? <Button titulo="Salvar" aoPressionar={salvar} carregando={salvando} /> : null}
        {apagado ? <Button titulo="Restaurar vínculo" variante="secundario" icone="refresh" carregando={salvando} aoPressionar={restaurar} /> : null}
        <Button
          titulo={apagado ? 'Voltar' : 'Cancelar'}
          variante="secundario"
          desabilitado={salvando}
          aoPressionar={function () {
            router.back();
          }}
        />
      </View>

      {!criando && !apagado ? (
        <View style={estilos.perigo}>
          <Button
            titulo="Apagar vínculo"
            variante="textoPerigo"
            icone="trash-outline"
            aoPressionar={function () {
              setAviso('');
              setConfirmandoExclusao(true);
            }}
          />
        </View>
      ) : null}

      <ConfirmModal
        visivel={confirmandoExclusao}
        titulo="Apagar vínculo?"
        mensagem="Este fornecedor deixa de aparecer como opção para esta matéria-prima. Dá para restaurar depois."
        textoConfirmar="Apagar"
        perigo
        carregando={salvando}
        aoConfirmar={apagar}
        aoCancelar={function () {
          setConfirmandoExclusao(false);
        }}
      />
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
    gap: 10,
  },
  perigo: {
    marginTop: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
});
