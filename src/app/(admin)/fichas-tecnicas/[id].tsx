// Formulário de ficha técnica. /fichas-tecnicas/novo adiciona um ingrediente (aceita ?variacao=ID); /fichas-tecnicas/3 edita, apaga ou restaura a ficha de id 3.
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { buscarFicha, criarFicha, atualizarFicha, apagarFicha, restaurarFicha, type FichaTecnica } from '../../../services/estoque';
import { opcoesVariacoes, opcoesMateriasPrimas, type OpcaoVariacao, type OpcaoMateriaPrima } from '../../../services/opcoes';
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

const PADRAO_QUANTIDADE = /^\d{1,7}(\.\d{1,3})?$/;
const CAMPOS = ['variacao', 'materia_prima', 'quantidade_necessaria'];

export default function FormularioFichaTecnica() {
  const { id, variacao } = useLocalSearchParams<{ id: string; variacao?: string }>();
  const criando = id === 'novo';

  const [variacoes, setVariacoes] = useState<OpcaoVariacao[]>([]);
  const [materias, setMaterias] = useState<OpcaoMateriaPrima[]>([]);
  const [variacaoId, setVariacaoId] = useState<number | null>(variacao ? Number(variacao) : null);
  const [materiaId, setMateriaId] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState('');
  const [ficha, setFicha] = useState<FichaTecnica | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(true);
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
    setErroGeral('');
    try {
      const [listaVariacoes, listaMaterias] = await Promise.all([opcoesVariacoes(), opcoesMateriasPrimas()]);
      setVariacoes(listaVariacoes);
      setMaterias(listaMaterias);
      if (!criando) {
        const dados = await buscarFicha(Number(id));
        setFicha(dados);
        setVariacaoId(dados.variacao);
        setMateriaId(dados.materia_prima.id);
        setQuantidade(dados.quantidade_necessaria.replace('.', ','));
      }
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível carregar a ficha técnica.'));
    } finally {
      setCarregando(false);
    }
  }

  const materiaEscolhida = materias.find(function (opcao) {
    return opcao.valor === materiaId;
  });
  const unidade = materiaEscolhida ? materiaEscolhida.unidade.toLowerCase() : ficha ? ficha.materia_prima.unidade_medida.toLowerCase() : '';
  const nomeVariacao = variacoes.find(function (opcao) {
    return opcao.valor === variacaoId;
  });

  async function salvar() {
    setErroGeral('');
    const novosErros: Record<string, string> = {};
    const quantidadeApi = quantidade.trim().replace(',', '.');
    if (variacaoId === null) {
      novosErros.variacao = 'Escolha a variação.';
    }
    if (materiaId === null) {
      novosErros.materia_prima = 'Escolha a matéria-prima.';
    }
    if (!PADRAO_QUANTIDADE.test(quantidadeApi) || Number(quantidadeApi) <= 0) {
      novosErros.quantidade_necessaria = 'Informe uma quantidade maior que zero, com até 3 casas.';
    }
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0 || variacaoId === null || materiaId === null) {
      return;
    }
    setSalvando(true);
    try {
      if (criando) {
        await criarFicha({ variacao: variacaoId, materia_prima: materiaId, quantidade_necessaria: quantidadeApi });
      } else {
        await atualizarFicha(Number(id), { materia_prima: materiaId, quantidade_necessaria: quantidadeApi });
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
        setErroGeral(mensagemDeErro(e, 'Não foi possível salvar a ficha técnica.'));
      }
    } finally {
      setSalvando(false);
    }
  }

  async function apagar() {
    setSalvando(true);
    try {
      await apagarFicha(Number(id));
      setConfirmandoExclusao(false);
      setAviso('Ficha técnica apagada. Ela não entra mais na fabricação.');
      await carregar();
    } catch (e) {
      setConfirmandoExclusao(false);
      setErroGeral(mensagemDeErro(e, 'Não foi possível apagar a ficha técnica.'));
    } finally {
      setSalvando(false);
    }
  }

  async function restaurar() {
    setSalvando(true);
    try {
      await restaurarFicha(Number(id));
      setAviso('Ficha técnica restaurada.');
      await carregar();
    } catch (e) {
      setErroGeral(mensagemDeErro(e, 'Não foi possível restaurar a ficha técnica.'));
    } finally {
      setSalvando(false);
    }
  }

  const titulo = criando ? 'Novo ingrediente' : 'Editar ficha técnica';

  if (carregando) {
    return (
      <Screen>
        <Header titulo={titulo} voltar />
        <ScreenState tipo="carregando" mensagem="Carregando ficha técnica…" />
      </Screen>
    );
  }

  const apagada = ficha !== null && ficha.apagada_em !== null;

  return (
    <Screen rolavel>
      <Header titulo={titulo} subtitulo="Quanto desta matéria-prima vai em um sabonete" voltar />

      {apagada ? <Notice mensagem="Esta ficha técnica está apagada e não entra na fabricação." tom="erro" /> : null}
      {aviso ? <Notice mensagem={aviso} tom="sucesso" /> : null}
      {erroGeral ? <Notice mensagem={erroGeral} tom="erro" /> : null}

      <View style={estilos.campos}>
        {criando ? (
          <Select
            rotulo="Variação"
            opcoes={variacoes}
            selecionados={variacaoId === null ? [] : [variacaoId]}
            aoMudar={function (valores) {
              setVariacaoId(valores.length > 0 ? Number(valores[0]) : null);
            }}
            placeholder="Escolha a variação"
            erro={erros.variacao}
          />
        ) : (
          <TextField
            rotulo="Variação"
            valor={nomeVariacao ? nomeVariacao.rotulo : `Variação ${variacaoId}`}
            aoMudar={function () {}}
            ajuda="A variação não muda depois de criada."
            desabilitado
          />
        )}
        <Select
          rotulo="Matéria-prima"
          opcoes={materias}
          selecionados={materiaId === null ? [] : [materiaId]}
          aoMudar={function (valores) {
            setMateriaId(valores.length > 0 ? Number(valores[0]) : null);
          }}
          placeholder="Escolha a matéria-prima"
          erro={erros.materia_prima}
        />
        <TextField
          rotulo="Quantidade por sabonete"
          valor={quantidade}
          aoMudar={function (texto) {
            setQuantidade(mascararDecimal(texto, 3));
          }}
          placeholder="Ex.: 25"
          erro={erros.quantidade_necessaria}
          ajuda="Na unidade da matéria-prima. Até 3 casas decimais."
          sufixo={unidade || undefined}
          teclado="decimal-pad"
          desabilitado={salvando || apagada}
        />
      </View>

      <View style={estilos.acoes}>
        {!apagada ? <Button titulo="Salvar" aoPressionar={salvar} carregando={salvando} /> : null}
        {apagada ? <Button titulo="Restaurar ficha técnica" variante="secundario" icone="refresh" carregando={salvando} aoPressionar={restaurar} /> : null}
        <Button
          titulo={apagada ? 'Voltar' : 'Cancelar'}
          variante="secundario"
          desabilitado={salvando}
          aoPressionar={function () {
            router.back();
          }}
        />
      </View>

      {!criando && !apagada ? (
        <View style={estilos.perigo}>
          <Button
            titulo="Apagar ficha técnica"
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
        titulo="Apagar ficha técnica?"
        mensagem="Este ingrediente deixa de entrar na fabricação desta variação. Dá para restaurar depois."
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
